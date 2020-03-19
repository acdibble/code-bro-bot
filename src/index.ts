import app from './server';

app.listen(process.env.PORT, () => {
  console.log(`Listening on ${process.env.PORT}`);
});
