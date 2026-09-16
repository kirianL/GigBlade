const GONE = {
	message: "El formulario de solicitudes no está disponible.",
};

export async function GET() {
	return Response.json(GONE, { status: 404 });
}

export async function POST() {
	return Response.json(GONE, { status: 410 });
}
