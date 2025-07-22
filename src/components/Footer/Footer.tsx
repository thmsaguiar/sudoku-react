import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <div className={styles.footer}>
      © 2025 desenvolvido por <a href="https://thmsaguiar.netlify.app/" target="_blank">Thomas Aguiar</a>
    </div>
  );
}