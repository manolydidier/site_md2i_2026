import GrapesEditor from "@/app/components/edito/GrapesEditor";


type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const { id } = await params;
  return <GrapesEditor mode="edit" postId={id} />;
}