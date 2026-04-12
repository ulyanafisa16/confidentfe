// src/components/secret/ViewLoading.tsx

export default function ViewLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-[#1d9e75] border-t-transparent animate-spin" />
      <p className="text-sm text-gray-400">Checking secret...</p>
    </div>
  )
}