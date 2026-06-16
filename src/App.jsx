import { supabase } from "./supabase";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";


export default function App() {
  const [user, setUser] = useState(null);

useEffect(() => {
console.log("Supabase connected:", supabase);
}, []);

  const [code, setCode] = useState("");

  const [transactions, setTransactions] = useState([]);
  const [montant, setMontant] = useState("");
  const [type, setType] = useState("recette");
  const [categorie, setCategorie] = useState("Accueil");

  const categories = ["Accueil", "Alimentation"];


  useEffect(() => {
  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.log("FETCH ERROR:", error);
    } else {
      setTransactions(data || []);
    }
  };

  // Chargement initial
  fetchTransactions();

  // Realtime
  const channel = supabase
    .channel("transactions-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "transactions",
      },
      (payload) => {
        console.log("CHANGE:", payload);
        fetchTransactions();
      }
    )
    .subscribe((status) => {
      console.log("Realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
  // LOGIN
  const login = () => {
    const c = code.trim().toLowerCase();

    if (c === "frater") setUser("frater");
    else if (c === "econo") setUser("econo");
    else alert("Code incorrect");
  };

  const logout = () => {
    setUser(null);
    setCode("");
  };

  // ADD TRANSACTION 
const ajouter = async () => {
  if (!montant) return;

  const { data, error } = await supabase
    .from("transactions")
    .insert([
      {
        montant: Number(montant),
        type,
        categorie,
        createdBy: user,
      },
    ]);

  if (error) {
    console.log("INSERT ERROR:", error);
    alert("Erreur: " + error.message);
  } else {
    console.log("Inserted:", data);

    const { data: newData } = await supabase
      .from("transactions")
      .select("*");

    setTransactions(newData || []);
    setMontant("");
  }
};

  // FILTERS
const recettes = transactions.filter(
  (t) => t.type === "recette"
);

const depenses = transactions.filter(
  (t) => t.type === "depense"
);

const recettesAccueil = recettes.filter(
  (t) => t.categorie?.toLowerCase() === "accueil"
);

const depensesAccueil = depenses.filter(
  (t) => t.categorie?.toLowerCase() === "accueil"
);

const recettesAlimentation = recettes.filter(
  (t) => t.categorie?.toLowerCase() === "alimentation"
);

const depensesAlimentation = depenses.filter(
  (t) => t.categorie?.toLowerCase() === "alimentation"
);
  // SOLDES
  const solde =
    recettes.reduce((a, b) => a + b.montant, 0) -
    depenses.reduce((a, b) => a + b.montant, 0);

  const soldeAccueil =
    recettesAccueil.reduce((a, b) => a + b.montant, 0) -
    depensesAccueil.reduce((a, b) => a + b.montant, 0);

  const soldeAlimentation =
    recettesAlimentation.reduce((a, b) => a + b.montant, 0) -
    depensesAlimentation.reduce((a, b) => a + b.montant, 0);

  const chartData = [
    { name: "Accueil", value: soldeAccueil || 0 },
    { name: "Alimentation", value: soldeAlimentation || 0 },
  ];

  const COLORS = ["#4CAF50", "#2196F3"];

  // LOGIN SCREEN
  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>

        <input
          placeholder="Code (frater / econo)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <button onClick={login}>Se connecter</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h3>Utilisateur: {user.toUpperCase()}</h3>

      <button onClick={logout}>Déconnexion</button>

      {/* FORM */}
      <div style={{ marginTop: 20 }}>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="recette">Recette</option>
          <option value="depense">Dépense</option>
        </select>

        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          placeholder="Montant"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
        />

        <button onClick={ajouter}>Ajouter</button>
      </div>

      {/* DASHBOARD */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <div>🟢 Recettes <h3>{recettes.reduce((a,b)=>a+b.montant,0)}</h3></div>
        <div>🔴 Dépenses <h3>{depenses.reduce((a,b)=>a+b.montant,0)}</h3></div>
        <div>💰 Solde <h3>{solde}</h3></div>
      </div>

      {/* SOLDES */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <div>🏠 Accueil <h3>{soldeAccueil}</h3></div>
        <div>🍽️ Alimentation <h3>{soldeAlimentation}</h3></div>
      </div>

      {/* CHART */}
      <div style={{ marginTop: 30, textAlign: "center" }}>
        <h3>📊 Répartition</h3>

        <PieChart width={320} height={320}>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            label
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </div>

      {/* LIST */}
      <div style={{ marginTop: 20 }}>
        <h3>Transactions</h3>

        {transactions.map((t) => (
          <div key={t.id}>
            {t.type.toUpperCase()} - {t.montant} BIF ({t.categorie})<br />
            by {t.createdBy} | {t.createdAt}
          </div>
        ))}
      </div>
    </div>
  );
}