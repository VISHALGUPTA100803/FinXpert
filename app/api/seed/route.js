// /api/seed endpoint because of nextjs directory
import { seedTransactions } from "@/actions/seed";
// In Next.js App Router, you export functions named after HTTP methods (GET, POST, etc.) to handle those requests.
export async function GET() {

    const result = await seedTransactions();
    return Response.json(result);
    // Response.json(result) → converts your JS object into a JSON HTTP response.
}