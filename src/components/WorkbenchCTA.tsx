const PRODUCT_URL = "https://workbench.earlythunder.com/workbench/";

export default function WorkbenchCTA({ placement = "footer" }: { placement?: string }) {
  const tracking = `?utm_source=earlythunder&utm_medium=website&utm_content=${placement}`;
  return (
    <section className={`workbench-offer workbench-offer--${placement}`} aria-label="Token Evidence Workbench">
      <div className="workbench-offer__copy">
        <p className="workbench-offer__eyebrow">TOKEN EVIDENCE WORKBENCH</p>
        <h2>Turn what you read into research you can use.</h2>
        <p>Keep sources, compare token assumptions, and export your own research memo. An offline workspace for the evidence behind your decisions.</p>
        <p className="workbench-offer__details">$29 USD once · Version 1 ZIP · No subscription</p>
      </div>
      <div className="workbench-offer__actions">
        <a className="workbench-offer__buy" href={PRODUCT_URL + tracking}>Get the Workbench · $29 <span aria-hidden="true">→</span></a>
        <a className="workbench-offer__preview" href={PRODUCT_URL + "preview/" + tracking}>Try the free preview <span aria-hidden="true">↗</span></a>
        <span className="workbench-offer__note">Your data stays in your browser.</span>
      </div>
    </section>
  );
}
