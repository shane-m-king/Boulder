interface GamePagesProps {
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

export const GamePages = ({ page, totalPages, setPage }: GamePagesProps) => {
  const getPaginationRange = () => {
    const maxVisible = 9;
    const range: (number | string)[] = [];
    const totalNumbersToShow = maxVisible - 2;
    const leftBound = page - Math.floor(totalNumbersToShow / 2);
    const rightBound = page + Math.floor(totalNumbersToShow / 2);

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
      return range;
    }

    if (page <= Math.ceil(totalNumbersToShow / 2)) {
      for (let i = 1; i <= totalNumbersToShow + 1; i++) range.push(i);
      range.push("…", totalPages);
      return range;
    }

    if (page >= totalPages - Math.floor(totalNumbersToShow / 2)) {
      range.push(1, "…");
      for (let i = totalPages - totalNumbersToShow; i <= totalPages; i++) range.push(i);
      return range;
    }

    range.push(1, "…");
    for (let i = leftBound; i <= rightBound; i++) range.push(i);
    range.push("…", totalPages);
    return range;
  };

  const paginationRange = getPaginationRange();

  return (
    <>
    {/* Only display if search results exist */}
      { paginationRange.length ?
      (<div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
        <button
          onClick={() => setPage(Math.max(page - 1, 1))}
          disabled={page === 1}
          className={`px-3 py-2 rounded-md text-sm font-body transition-all cursor-pointer ${
            page === 1
              ? "bg-boulder-mid text-gray-500 cursor-not-allowed"
              : "bg-boulder-gold text-boulder-dark hover:bg-boulder-accent"
          }`}
        >
          Previous
        </button>
  
        {paginationRange.map((num, idx) =>
          typeof num === "number" ? (
            <button
              key={idx}
              onClick={() => setPage(num)}
              className={`px-3 py-2 rounded-md text-sm font-body transition-all cursor-pointer ${
                page === num
                  ? "bg-boulder-accent text-boulder-dark font-semibold"
                  : "bg-boulder-mid text-gray-300 hover:bg-boulder-gold hover:text-boulder-dark"
              }`}
            >
              {num}
            </button>
          ) : (
            <span key={idx} className="px-2 text-gray-500">{num}</span>
          )
        )}
  
        <button
          onClick={() => setPage(Math.min(page + 1, totalPages))}
          disabled={page === totalPages}
          className={`px-3 py-2 rounded-md text-sm font-body transition-all cursor-pointer ${
            page === totalPages
              ? "bg-boulder-mid text-gray-500 cursor-not-allowed"
              : "bg-boulder-gold text-boulder-dark hover:bg-boulder-accent"
          }`}
        >
          Next
        </button>
      </div>) : <></>
      }
    </>
  );
}

export default GamePages;