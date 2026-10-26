export const NumberPad = ({ n, disabledDigits, onNumber }) => {
  const digits = Array.from({ length: n }, (_, i) => i + 1);

  return (
    <div className="numpad">
      <div className="numpad-digits">
        {digits.map((d) => (
          <button
            key={d}
            type="button"
            className="num-btn"
            disabled={disabledDigits.has(d)}
            onClick={() => onNumber(d)}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
};
