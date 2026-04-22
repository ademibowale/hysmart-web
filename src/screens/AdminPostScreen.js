import { useState } from "react";
import api from "../api";

export default function AdminPostScreen(){

const [caption,setCaption]=useState("");
const [image,setImage]=useState("");

const submit=async()=>{

await api.post("/community/post",{
caption,
image_url:image
});

alert("Posted");

};

return(

<div>

<h2>Create Community Post</h2>

<input
placeholder="Screenshot URL"
onChange={(e)=>setImage(e.target.value)}
/>

<textarea
placeholder="Caption"
onChange={(e)=>setCaption(e.target.value)}
/>

<button onClick={submit}>
Post
</button>

</div>

);

}