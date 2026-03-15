import stylex from '@stylexjs/stylex';

const styles = stylex.create({
  text: {
    color: 'rebeccapurple',
    textDecoration: 'underline',
  },
});

export default function HelloFromPastoria() {
  return <p {...stylex.props(styles.text)}>Hello from Pastoria!</p>;
}
