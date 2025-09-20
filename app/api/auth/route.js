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
            console.warn("Unauthorized access attempt.");
            return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectMongoDB();
        const user = await User.findById(session.user.id);

        if (!user) {
            console.warn("User not found.");
            return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true, userId: user._id });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}