import { useEffect, useState } from "react";
import dataJson from "../assets/data.json"; 

const useData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setData(dataJson);
    setLoading(false);
  }, []);

  return { data, loading };
};

export default useData;
