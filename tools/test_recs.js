async function test(userId) {
  try {
    const url = `http://localhost:5001/api/recommendations?top_n=5&user_id=${encodeURIComponent(userId)}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log('---', userId, '---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error for', userId, err.message || err);
  }
}

const users = [
  'AGP7EEKKJLA6CWVVGFW35VOUJDCA', // should have file reviews
  'nonexistent_user_12345', // no reviews, no demographics
];

(async () => {
  for (const u of users) await test(u);
})();
