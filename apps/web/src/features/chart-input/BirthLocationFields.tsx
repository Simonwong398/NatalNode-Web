interface BirthLocationFieldsProps {
  error?: string;
  isInteractionDisabled: boolean;
  locationLabel: string;
  onLocationLabelChange: (value: string) => void;
}

export default function BirthLocationFields({
  error,
  isInteractionDisabled,
  locationLabel,
  onLocationLabelChange
}: BirthLocationFieldsProps) {
  return (
    <>
      <label className="nn-type-label" htmlFor="birth-place">
        Birth place
      </label>
      <input
        aria-describedby={error ? 'birth-place-error' : undefined}
        aria-invalid={Boolean(error)}
        className="nn-field mt-2 max-w-3xl"
        disabled={isInteractionDisabled}
        id="birth-place"
        name="locationLabel"
        onChange={(event) => onLocationLabelChange(event.target.value)}
        placeholder="City, region, country"
        required
        type="text"
        value={locationLabel}
      />
      {error ? (
        <p className="nn-status nn-status--error mt-2" id="birth-place-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
