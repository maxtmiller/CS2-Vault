export function LoadingInventory() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-t-lg bg-gray-800" />
          <div className="space-y-2 rounded-b-lg bg-gray-800 p-2">
            <div className="h-4 rounded bg-gray-700" />
            <div className="h-3 w-2/3 rounded bg-gray-700" />
          </div>
        </div>
      ))}
    </div>
  )
}

