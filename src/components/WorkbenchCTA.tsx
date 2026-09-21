const PRODUCT_URL = "https://workbench.earlythunder.com/workbench/";

export default function WorkbenchCTA({ placement = "footer" }: { placement?: string }) {
  const tracking = `?utm_source=earlythunder&utm_medium=website&utm_campaign=workbench-fit&utm_content=${encodeURIComponent(placement)}`;
  return (
    <section className={`workbench-offer workbench-offer--${placement}`} aria-label="Token Evidence Workbench">
      <div className="workbench-offer__copy">
        <p className="workbench-offer__eyebrow">TOKEN EVIDENCE WORKBENCH</p>
        <h2>Turn what you read into research you can use.</h2>
        <p>Keep sources, compare token assumptions, and export your own research memo. An offline workspace for the evidence behind your decisions.</p>
        <details className="workbench-offer__fit">
          <summary>Is the Workbench right for my research?</summary>
          <p>Use the free calculators for a quick calculation. Use the Workbench when you need to collect sources, compare your own token assumptions, and export a research memo.</p>
          <p>Try the preview: add a source, record an assumption, and check the memo workflow before buying. This is a research workspace, not a trading signal or a promise of investment returns.</p>
        </details>
        <p className="workbench-offer__details">$29 USD once · Version 1 ZIP · No subscription</p>
      </div>
      <div className="workbench-offer__actions">
        <a className="workbench-offer__buy" href={PRODUCT_URL + tracking}>Get the Workbench — $29 <span aria-hidden="true">→</span></a>
        <a className="workbench-offer__preview" href={PRODUCT_URL + "preview/" + tracking}>Try the free preview <span aria-hidden="true">↗</span></a>
        <span className="workbench-offer__note">Your data stays in your browser.</span>
      </div>
    </section>
  );
}
