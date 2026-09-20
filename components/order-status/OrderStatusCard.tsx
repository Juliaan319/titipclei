import { getOrderStatus } from "@/lib/order-status";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface OrderStatusCardProps {
  status: string;
  paymentStatus?: string;
  rejectionReason?: string | null;
  paymentProofSent?: boolean;
  orderNumber?: string;
}

export function OrderStatusCard({ status, paymentStatus, rejectionReason, paymentProofSent, orderNumber }: OrderStatusCardProps) {
  const currentStatus = getOrderStatus(status);
  const Icon = currentStatus.icon;

  const isRejected = paymentStatus === "REJECTED" || status === "REJECTED";
  const isWaitingVerification = status === "WAITING_VERIFICATION" || paymentStatus === "WAITING_VERIFICATION";
  const isWaitingPayment = status === "WAITING_PAYMENT" || paymentStatus === "WAITING_PAYMENT";

  return (
    <div className="flex flex-col gap-4">
      {isRejected && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-red-900">
                Bukti Pembayaran Perlu Dikirim Ulang
              </h2>
              <p className="text-sm text-red-700">
                Bukti pembayaran sebelumnya belum dapat diverifikasi.
              </p>
            </div>
          </div>
          {rejectionReason && (
            <div className="mt-3 rounded-xl bg-red-100/50 p-3 text-sm text-red-800">
              <span className="font-semibold">Alasan:</span> {rejectionReason}
            </div>
          )}
          <div className="mt-4">
            {orderNumber ? (
              <Link href={`/payment/${orderNumber}`} className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-700">
                Upload Bukti Baru
              </Link>
            ) : (
              <button className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-700">
                Upload Bukti Baru
              </button>
            )}
          </div>
        </div>
      )}

      {!isRejected && (
        <div className={`rounded-xl border p-5 ${currentStatus.color.bg.replace("bg-", "border-").replace("100", "200")} ${currentStatus.color.bg}`}>
          <div className="flex items-start gap-4">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white ${currentStatus.color.text} shadow-sm`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${currentStatus.color.text.replace("500", "900").replace("600", "900").replace("700", "900").replace("800", "900")}`}>
                {currentStatus.headline}
              </h2>
              <p className={`mt-1 text-sm ${currentStatus.color.text.replace("800", "700")}`}>
                {currentStatus.description}
              </p>
              
              {isWaitingVerification && paymentProofSent !== false && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/50 px-3 py-2 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Bukti pembayaran sudah berhasil dikirim.
                </div>
              )}

              {currentStatus.nextStep && !isWaitingVerification && !isWaitingPayment && (
                <div className="mt-4">
                  <p className={`text-sm font-medium ${currentStatus.color.text.replace("800", "700")}`}>
                    {currentStatus.nextStep}
                  </p>
                </div>
              )}
              {currentStatus.nextStep && isWaitingVerification && (
                <div className="mt-4">
                  <p className={`text-sm font-medium ${currentStatus.color.text.replace("800", "700")}`}>
                    {currentStatus.nextStep}
                  </p>
                </div>
              )}
              {currentStatus.nextStep && isWaitingPayment && (
                <div className="mt-4">
                  {orderNumber ? (
                    <Link href={`/payment/${orderNumber}`} className={`inline-flex h-10 items-center justify-center rounded-lg bg-amber-600 px-4 font-semibold text-white hover:bg-amber-700`}>
                      {currentStatus.nextStep}
                    </Link>
                  ) : (
                    <button className={`inline-flex h-10 items-center justify-center rounded-lg bg-amber-600 px-4 font-semibold text-white hover:bg-amber-700`}>
                      {currentStatus.nextStep}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
