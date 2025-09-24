export async function load({ params }: { params: { id: string } }) {
  return { id: params.id };
}

export default function BlogPost({ id }: { id: string }) {
  return <h1>Blog post {id}</h1>;
}