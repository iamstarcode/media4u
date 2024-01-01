(async () => {
  const originalFileName = 'my/file:name?<>|example';

  const encoded = Buffer.from('Kimetsu no Yaiba- Yuukaku-hen')
    .toString('base64url')
    .substring(0, 24);
  console.log(encoded);
})();
