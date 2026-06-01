# BI-ML2 — Interaktivní průvodce

Interaktivní vizualizace ke **skriptům z předmětu BI-ML2 (Strojové učení 2)**.
Ke každé kapitole a podkapitole je tu „hratelná“ vizualizace (posuvníky, tažení
myší, animace, simulace), aby šlo vidět, **co daný pojem reálně dělá**. Teorie
záměrně není součástí webu — ta je ve skriptech (`ml2_skripta.pdf`), na která
každá stránka odkazuje.

## Obsah (34 vizualizací, 12 kapitol)

| Kapitola | Vizualizace |
|---|---|
| §1 Základy z ML1 | prokletí dimenzionality, přeučení, gradientní sestup |
| §2 Regrese & jádro | bázové funkce, jádrový trik (lift 1D→2D), jádrová regrese |
| §3 SVM | princip největšího odstupu (tažení), SVM s jádrem (SMO solver) |
| §4 Redukce dimenze | ortogonální projekce, PCA (vlastní vektory), manifold/LLE |
| §5 Naivní Bayes | 2D MAP klasifikace, Bayesovský odhad (add-one) |
| §6 Generativní & LDA | LDA vs. QDA hranice, PCA vs. LDA projekce |
| §7 Perceptron | animovaný trénink, problém XOR |
| §8 Sítě & backprop | aktivace, ztráty, **živě trénovaná MLP**, výpočetní graf |
| §9 Trénink | optimalizační závod (SGD/momentum/Adam), dropout, mizející gradient |
| §10 CNN & RNN | konvoluce (filtry), pooling/stride, rozbalená RNN |
| §11 NLP | tf-idf matice, word embeddings (analogie), self-attention |
| §12 Posilované učení | explorace/exploatace, k-ruký bandita, MDP gridworld |

## Spuštění lokálně

Je to čistě statický web bez build kroku. Stačí servírovat adresář:

```bash
python3 -m http.server 8000
# pak otevři http://localhost:8000
```

(Otevření `index.html` přímo přes `file://` většinou taky funguje.)

## Nasazení přes Coolify

1. V Coolify vytvoř novou aplikaci z **public Git repository** (toto repo).
2. **Build Pack: Static** (servíruje se přes Nginx, žádný build/install příkaz).
3. **Publish / base directory:** kořen repozitáře (`/`).
4. Deploy. Hotovo — routing je hash-based (`#téma`), takže refresh na podstránce
   nedělá 404 a žádná serverová konfigurace není potřeba.

## Struktura

```
index.html            # kostra (sidebar, router) + seznam <script>
assets/style.css      # tmavý styl
assets/core.js        # registr kapitol, router, Canvas třída Plot, lin. algebra
assets/ch00_intro.js … ch12_rl.js   # jednotlivé kapitoly (každá registruje viz)
ml2_skripta.pdf       # skripta, na která web odkazuje
```

Technologie: vanilla JS + HTML5 Canvas, **žádné závislosti**. Veškerá matematika
(SVM přes SMO, PCA přes vlastní čísla 2×2, MLP s backpropem, ridge regrese,
bandita, …) běží přímo v prohlížeči.
