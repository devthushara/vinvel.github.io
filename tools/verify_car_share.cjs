const { handler } = require('../netlify/functions/car-share.cjs');

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node tools/verify_car_share.cjs <carId>');
    process.exit(1);
  }

  const baseEvent = { headers: { host: 'localhost:8888' } };

  const resDebug = await handler({
    ...baseEvent,
    queryStringParameters: { id, debug: '1' },
  });

  const resNormal = await handler({
    ...baseEvent,
    queryStringParameters: { id },
  });

  function summarize(label, body) {
    const ogImages = body
      .split(/\n/)
      .filter((l) => /property=\"og:image\"/i.test(l));
    const hasRefresh = /http-equiv=\"refresh\"/i.test(body);

    console.log(`\n=== ${label} ===`);
    console.log('og:image tags:', ogImages.length);
    console.log('has meta refresh:', hasRefresh);
    console.log(ogImages.slice(0, 10).join('\n'));
  }

  summarize('debug=1 (should NOT redirect)', resDebug.body || '');
  summarize('normal (should redirect for humans)', resNormal.body || '');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
