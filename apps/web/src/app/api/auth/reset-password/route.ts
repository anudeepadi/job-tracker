import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { parseBody } from "@/lib/validations/common";
import { resetPasswordSchema } from "@/lib/validations/auth";

/**
 * Reset password with token
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, resetPasswordSchema);
    if ("error" in parsed) return parsed.error;
    const { token, password } = parsed.data;

    // Find password reset record
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 },
      );
    }

    // Check if already used
    if (resetRecord.used) {
      return NextResponse.json(
        { error: "This reset link has already been used" },
        { status: 400 },
      );
    }

    // Check if expired
    if (resetRecord.expiresAt < new Date()) {
      await prisma.passwordReset.delete({
        where: { id: resetRecord.id },
      });
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(password);

    // Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    // Invalidate all existing sessions for this user
    await prisma.session.deleteMany({
      where: { userId: resetRecord.userId },
    });

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
