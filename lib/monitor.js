// The recurring "agent" loop: re-prices every due subscription and mock-texts the user only
// when it finds something cheaper than the last best price on file.
const { getQuotes } = require("./rateEngine");
const subscriptions = require("./subscriptions");
const { sendSms } = require("./sms");

async function runCheckCycle(now = Date.now()) {
  const due = await subscriptions.getDueSubscriptions(now);
  const results = [];

  for (const sub of due) {
    const { quotes } = getQuotes(sub.quoteInput);
    const best = quotes[0];
    const improved = best.annualPremium < sub.bestAnnualPremium;

    if (improved) {
      const savings = Math.round(sub.bestAnnualPremium - best.annualPremium);
      sendSms({
        to: sub.phoneNumber,
        body:
          `Quotely update: ${best.carrierName} is now ~$${Math.round(best.annualPremium)}/yr for ` +
          `your profile — about $${savings}/yr less than your last best (${sub.bestCarrierName}). ` +
          `Open Quotely to see the new breakdown.`,
      });
    }

    await subscriptions.recordCheck(sub.id, {
      checkedAt: new Date().toISOString(),
      bestAnnualPremium: improved ? best.annualPremium : sub.bestAnnualPremium,
      bestCarrierName: improved ? best.carrierName : sub.bestCarrierName,
    });

    results.push({ id: sub.id, improved, bestAnnualPremium: best.annualPremium });
  }

  return results;
}

module.exports = { runCheckCycle };
