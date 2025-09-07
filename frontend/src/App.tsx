import React, {useEffect, useState} from "react"; // importing react and hooks

// added icons to make frontend more pretty!
const ICONS: Record<string, string> = {
  Produce: "🍅",
  Vegetables: "🥦",
  Fruits: "🍎",
  Meat: "🥩",
  Poultry: "🍗",
  Seafood: "🐟",
  Dairy: "🥛",
  Bakery: "🥖",
  Pantry: "📦",
  Spices: "🧂",
  Oil: "🫒",
  Default: "🛒",
};


// types

// define payload thats defined in models.py
interface GenerateRequest {
  keywords:string;
  meals: number;
  servings_per_meal: number;
}

// define backend returned object
interface GroceryRequest extends GenerateRequest{
  id: number;
  ai_response: any; // allowing for flexible JSON formatting
  created_at: string;
}


// api base

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://127.0.0.1:8000/api";


// main

export default function App() {
  // manage/control user inputs
  const [keywords, setKeywords] = useState<string>("");
  const [meals, setMeals] = useState<number>(1);
  const [servings, setServings] = useState<number>(1);

  // ui states
  const [loading, setLoading] = useState<boolean>(false); // generation text
  const [error, setError] = useState<string>(""); //stores error message
  const [result, setResult] = useState<GroceryRequest | null>(null); // holds requests

  // history states
  const [history, setHistory] = useState<GroceryRequest[]>([]); // list of past requests
  const [historyLoading, setHistoryLoading] = useState<boolean>(false); // loading flag for history
  const [historyError, setHistoryError] = useState<string>(""); // stores error for history


  // fetch history
  useEffect (() => {
    // define async function
    const fetchHistory = async () => {
      setHistoryLoading(true); // update history state
      setHistoryError(""); // clear previous errors

      try {
        // call request list endpoint
        const res = await fetch(`${API_BASE}/history`);

          if (!res.ok){ // if fetch fails
            throw new Error(`History fetch failed with status ${res.status}`); // throw error message
          }

          const data: GroceryRequest[] = await res.json(); // parse json response
          setHistory(data); // store history data
        }
        catch (err: any) { // catches all other errors
          setHistoryError(err?.message || "failed to retreive history"); // story history error in respective state
        }
        finally{
          setHistoryLoading(false); // clear loading state, return to false
        }
      };

      fetchHistory(); // call function
  }, []); // empty dependancy array --> more research needed


  // POST function, returns groceryrequest object

  const generatePlan = async (payload: GenerateRequest): Promise<GroceryRequest> => { // takes a json payload form user and promises a grocery request
    // send POST request to Django API
    const res = await fetch (`${API_BASE}/generate/`, {
      method: "POST",
      headers: {"Content-Type": "application/json" }, // we send json
      body: JSON.stringify(payload) // serialize user payload (stringify converts value into json-formatted string)
    });

    // error control
    if (!res.ok) {
      // for debugging request
      let detail = `Error: ${res.status}`; 
      try {
        const j = await res.json();
        detail = j?.error || JSON.stringify(j); // if server provide 2xx error message use that otherwise convert it into json formatted string
      }
      catch (_){
      }
      throw new Error(detail); // throw error for display message
    }

    return res.json(); // return promised json grocery request
  };

  // submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // no refreshing on form submission

    // normlaize ui states
    setError("");
    setResult(null);

    //validate input!
    if (!keywords.trim()){
      setError("Please enter at least 1 keyword!"); //update error state
      return; // abort mission
    }

    if (meals < 1 || servings < 1){
      setError("Meals and servings must have a value of atleast 1");
      return;
    }

    setLoading(true);

    // post the req
    try {
      const payload: GenerateRequest = { // payload as defined in models
        keywords: keywords.trim(),
        meals,
        servings_per_meal: servings,
      };

      const data = await generatePlan(payload); // preform POST

      setResult(data); // store res to be rendered

      // update new submission to history

      const res = await fetch(`${API_BASE}/history/`); // VERIFY THIS WITH URLS.PY
      if (res.ok){
        const hist: GroceryRequest[] = await res.json();
        setHistory(hist);
      }
    }
    catch (err: any){
      setError(err?.message || "Request Failed :(") // error catching
    }
    finally {
      setLoading(false) // clear loading state
    }
  };


// ----------------------
// Render helpers: meals & grocery list
// ----------------------


const renderMeals = (ai: any) => {
  if (!ai || !ai.meals) return null;

  const meals = Array.isArray(ai.meals) ? ai.meals : [ai.meals];

  const renderIngredient = (ing: any) => {
    if (!ing) return "Unnamed ingredient";
    if (typeof ing === "string") return ing;
    if (typeof ing === "object") {
      const parts = [
        ing.item ?? "Unnamed ingredient",
        ing.quantity ? `(${ing.quantity}${ing.unit ? ` ${ing.unit}` : ""})` : "",
      ];
      return parts.filter(Boolean).join(" ");
    }
    return String(ing);
  };

  const renderMealItem = (m: any, i: number) => {
    if (!m) return `Meal ${i + 1}`;
    if (typeof m === "string") return m;

    const name = m.name ?? `Meal ${i + 1}`;
    const ingredients = Array.isArray(m.ingredients) ? m.ingredients : [];
    const instructions = m.instructions ?? "";

    return (
      <div
        key={i}
        className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200"
      >
        <h4 className="text-lg font-semibold mb-2 text-gray-800">{name}</h4>

        {ingredients.length > 0 && (
          <ul className="list-disc list-inside ml-4 text-gray-700 text-sm space-y-1">
            {ingredients.map((ing, j) => (
              <li key={j}>{renderIngredient(ing)}</li>
            ))}
          </ul>
        )}

        {instructions && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
            {instructions}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        🍽️ <span className="ml-2">Meals</span>
      </h3>
      <div className="space-y-4">
        {meals.map((m, i) => renderMealItem(m, i))}
      </div>
    </div>
  );
};





// render grocerylist not able to handle all shapes the openai api call may return --> vibecoded for now
const renderGroceryList = (ai: any) => {
  if (!ai || !ai.grocery_list) return null;

  const list = ai.grocery_list;

  const renderItem = (it: any) => {
    if (!it) return "Unnamed item";
    if (typeof it === "string") return it;
    if (typeof it === "object") return `${it.item ?? "Unnamed item"}${it.quantity ? ` (${it.quantity})` : ""}`;
    return String(it);
  };

  const renderList = (items: any) => {
    // Ensure items is always an array
    const arr = Array.isArray(items) ? items : [items];
    return arr.map((it, idx) => <li key={idx}>{renderItem(it)}</li>);
  };

  // 1️⃣ Flat array
  if (Array.isArray(list)) {
    return (
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Grocery List</h3>
        <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
          {renderList(list)}
        </ul>
      </div>
    );
  }

  // 2️⃣ Sectioned object
  if (typeof list === "object" && list !== null) {
    return (
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-2">Grocery List</h3>
        <div className="space-y-3">
          {Object.entries(list).map(([section, items], idx) => {
            const icon = ICONS[section] || ICONS.Default;
            return (
              <div key={idx}>
                <div className="font-semibold text-lg flex items-center gap-2">
                  <span>{icon}</span> {section}
                </div>
                <ul className="list-disc list-inside ml-6 text-gray-700 text-sm mt-1 space-y-1">
                  {renderList(items)}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3️⃣ Single object
  return (
    <div className="mt-4">
      <h3 className="text-xl font-semibold mb-2">Grocery List</h3>
      <ul className="list-disc list-inside ml-4 space-y-1 text-gray-700">
        {renderList(list)}
      </ul>
    </div>
  );
};

  // rendering ui
    
return (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
    <div className="w-full max-w-4xl flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Grocery Planner
      </h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-xl p-6 w-full max-w-lg space-y-4"
      >
        {/* Keywords */}
        <div>
          <label htmlFor="keywords" className="font-semibold">
            Keywords
          </label>
          <input
            id="keywords"
            type="text"
            placeholder="e.g., pasta, tomatoes, spinach"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Meals & Servings */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="meals" className="font-semibold">
              Meals
            </label>
            <input
              id="meals"
              type="number"
              min={1}
              value={meals}
              onChange={(e) => setMeals(Number(e.target.value))}
              className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="servings" className="font-semibold">
              Servings per meal
            </label>
            <input
              id="servings"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="mt-2 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-semibold ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>

        {error && <div className="text-red-600">{error}</div>}
      </form>

      {/* RESULT */}
      {result && (
        <div className="mt-8 w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 space-y-8">
          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              🍽️ <span className="ml-2">Meals</span>
            </h3>
            {renderMeals(result.ai_response)}
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 flex items-center">
              🛒 <span className="ml-2">Grocery List</span>
            </h3>
            {renderGroceryList(result.ai_response)}
          </div>
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <div className="mt-10 w-full max-w-3xl">
          <h2 className="text-2xl font-semibold mb-4">History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300 rounded-lg shadow-sm">
              <thead className="bg-gray-200 text-left">
                <tr>
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Keywords</th>
                  <th className="p-2 border">Meals</th>
                  <th className="p-2 border">Servings</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="p-2 border">{h.id}</td>
                    <td className="p-2 border">{h.keywords}</td>
                    <td className="p-2 border">{h.meals}</td>
                    <td className="p-2 border">{h.servings_per_meal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
