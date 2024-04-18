import ora, { Ora } from 'ora';
export default function Spinner() {
  return ora({ spinner: 'dots12' });
}
