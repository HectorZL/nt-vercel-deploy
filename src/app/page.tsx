import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Desafio Relampago</h1>
          <p>
            Demo: rondas con cronometro server-side, respuestas y ranking.
          </p>
        </div>
        <div className={styles.ctas}>
          <Link className={styles.primary} href="/play">
            Entrar como estudiante
          </Link>
          <Link className={styles.secondary} href="/admin">
            Panel admin
          </Link>
        </div>
      </main>
    </div>
  );
}
