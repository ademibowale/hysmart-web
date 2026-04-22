
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';

// function Predictions() {
//   const [data,setData]=useState([]);

//   useEffect(()=>{
//     const fetchData=async()=>{
//       const token=localStorage.getItem('token');
//       const res=await axios.get('/gameForecast/weekend',{
//         headers:{ Authorization:`Bearer ${token}` }
//       });
//       setData(res.data);
//     };
//     fetchData();
//   },[]);

//   return (
//     <div>
//       <h2>Weekend Predictions</h2>
//       {data.map(item=>(
//         <div key={item.match_id}>
//           <strong>{item.home_team} vs {item.away_team}</strong>
//           <p>{item.prediction}</p>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default Predictions;
