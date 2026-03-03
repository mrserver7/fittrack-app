import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import TrainerCheckinReview from "@/components/checkins/trainer-checkin-review";

type Params = { params: Promise<{ id: string; checkinId: string }> };

export default async function TrainerCheckinPage({ params }: Params) {
  const { id: clientId, checkinId } = await params;
  const session = await auth();
  const trainerId = session!.user!.id!;

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkinId },
    include: {
      client: { select: { id: true, name: true, trainerId: true } },
      checkInForm: true,
    },
  });

  if (!checkIn || checkIn.client.trainerId !== trainerId || checkIn.clientId !== clientId) {
    notFound();
  }

  const questions: Array<{ id: string; label?: string; text?: string; type: string }> =
    JSON.parse(checkIn.checkInForm.questions || "[]");
  const responses: Record<string, string> = checkIn.responses
    ? JSON.parse(checkIn.responses)
    : {};

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/clients/${clientId}`}>
          <button className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50">{checkIn.checkInForm.name}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {checkIn.client.name} · Submitted {checkIn.submittedAt ? formatDateTime(checkIn.submittedAt) : "—"}
          </p>
        </div>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
          checkIn.trainerComment
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
            : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
        }`}>
          {checkIn.trainerComment ? "Reviewed" : "Awaiting review"}
        </span>
      </div>

      {/* Period */}
      <div className="text-xs text-gray-400 dark:text-gray-500 mb-6">
        Period: {formatDate(checkIn.periodStart)} – {formatDate(checkIn.periodEnd)}
      </div>

      {/* Questions + Responses */}
      <div className="space-y-4 mb-6">
        {questions.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-sm">No questions in this form.</p>
        )}
        {questions.map((q, i) => {
          const answer = responses[q.id];
          return (
            <div key={q.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                Q{i + 1} · {q.type.replace(/_/g, " ")}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
                {q.label || q.text || "Untitled question"}
              </p>
              <div className={`rounded-xl px-4 py-3 text-sm ${
                answer
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100 font-medium"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 italic"
              }`}>
                {answer ?? "No response"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trainer comment section */}
      <TrainerCheckinReview
        checkinId={checkinId}
        clientId={clientId}
        existingComment={checkIn.trainerComment ?? ""}
      />
    </div>
  );
}
