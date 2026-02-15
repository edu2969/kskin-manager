import { connectMongoDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/utils/authOptions";
import { getServerSession } from "next-auth";
import User from "@/models/user";

export async function GET() {
    try {
        console.log("Logging in...");
        const session = await getServerSession(authOptions);

        if (!session || !session.user || !session.user.id) {
            console.warn("Unauthorized access attempt.", { session });
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectMongoDB();
        const user = await User.findById(session.user.id);

        if (!user) {
            console.warn("User not found.", { userId: session.user.id });
            return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
        }

        console.log("User found:", { userId: user._id });
        return NextResponse.json({ ok: true, userId: user._id });
    } catch (error) {
        console.error("Error in GET /api/me:", error);
        return NextResponse.json({ ok: false, error: error.message || "Internal Server Error" }, { status: 500 });
    }
}