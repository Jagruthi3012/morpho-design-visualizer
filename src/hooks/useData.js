// import { useEffect, useState } from "react";

// const useData = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetch("/data.json")
//       .then((res) => res.json())
//       .then((json) => {
//         setData(json);
//         setLoading(false);
//       });
//   }, []);

//   return { data, loading };
// };

// export default useData;
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
