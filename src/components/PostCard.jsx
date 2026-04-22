export default function PostCard({post}){

return(

<div className="post-card">

<img src={post.image_url} />

<p>{post.caption}</p>

<button>Like</button>

<button>Comment</button>

</div>

);

}