import { useEffect, useState } from "react";
import axios from "axios";

export default function useAdminPredictions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/admin/predictions"); // your admin endpoint
      setData(res.data.data);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Faster refresh for admin (every 30s)
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  return { data, loading, refetch: fetchData };
}