const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const CATS = {
    peso: { un: [['g', .001], ['kg', 1]], base: 'kg', ph: 'Ex: 400' },
    liquido: { un: [['ml', .001], ['L', 1]], base: 'L', ph: 'Ex: 350' }
};
const OPC = ['A', 'B'], el = (p, o) => $(`#${p}-${o}`);
const brl = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
let cat = 'peso', ultimo = '';

try { const s = localStorage.getItem('ql-cat'); if (CATS[s]) cat = s; } catch (e) { }

// aceita 14,89 | 14.89 | 1.299,90 | 1.299
function num(t) {
    let s = t.replace(/[^\d.,]/g, '');

    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');

    return parseFloat(s) || 0;
}

$('#cards').innerHTML = OPC.map(o => `
<section class="card" id="card-${o}">
  <h2>Opção ${o} <span class="selo" hidden>✓ Melhor preço</span></h2>
  <label for="p-${o}">Quanto custa?</label>
  <div class="campo"><span>R$</span><input id="p-${o}" inputmode="numeric" autocomplete="off" placeholder="0,00"></div>
  <label for="t-${o}">Quanto vem na embalagem?</label>
  <div class="linha"><input id="t-${o}" inputmode="decimal" autocomplete="off"><select id="u-${o}" aria-label="Unidade da opção ${o}"></select></div>
  <button type="button" class="link" id="pk-${o}" aria-expanded="false">+ É pack? (várias unidades)</button>
  <div class="pack" id="pkbox-${o}" hidden>
    <label for="q-${o}">Vem quantas?</label>
    <input id="q-${o}" inputmode="numeric" value="1" autocomplete="off">
    <p class="total" id="tot-${o}"></p>
  </div>
  <p class="unit" id="un-${o}"></p>
</section>`).join('');

function setCat(c) {
    cat = c;
    try { localStorage.setItem('ql-cat', c); } catch (e) { }

    $$('.seg button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cat === c));

    OPC.forEach(o => {
        el('u', o).innerHTML = CATS[c].un.map(([n]) => `<option>${n}</option>`).join('');
        el('t', o).placeholder = CATS[c].ph;
    });

    calc();
}

function dados(o) {
    const preco = (+el('p', o).dataset.c || 0) / 100;
    const tam = num(el('t', o).value);
    const q = parseInt(el('q', o).value) || 1;
    const un = el('u', o).value;
    const f = CATS[cat].un.find(u => u[0] === un)[1];
    const total = tam * q * f;
    return { q, tam, total, up: preco && total ? preco / total : 0 };
}

function calc() {
    const base = CATS[cat].base, d = OPC.map(dados);

    OPC.forEach((o, i) => {
        el('un', o).textContent = d[i].up ? `${brl(d[i].up)} por ${base}` : '';
        el('tot', o).textContent = d[i].q > 1 && d[i].tam ? `${d[i].q} × ${fmt(d[i].tam)} ${el('u', o).value} = ${fmt(d[i].total)} ${base}` : '';
        $(`#card-${o}`).classList.remove('venc');
        $(`#card-${o} .selo`).hidden = true;
    });

    const res = $('#resultado');
    let html, anuncio;

    if (!d[0].up || !d[1].up) {
        res.className = 'resultado';
        html = '<p class="dica">Preencha preço e tamanho das duas opções.</p>';
        anuncio = '';
    } else {
        const [a, b] = [d[0].up, d[1].up], dif = Math.abs(a - b) / Math.max(a, b);
        const nums = `<p class="nums">${brl(a)} × ${brl(b)} por ${base}</p>`;
        res.className = 'resultado ok';

        if (dif < 0.01) {
            html = `<p class="titulo">Praticamente empate</p><p class="sub">Diferença menor que 1%</p><p class="nums">Escolha pela validade ou pelo que você vai usar.</p>`;
            anuncio = 'Praticamente empate';
        } else {
            const w = a < b ? 0 : 1, o = OPC[w];
            $(`#card-${o}`).classList.add('venc');
            $(`#card-${o} .selo`).hidden = false;
            html = `<p class="titulo"><span aria-hidden="true">✓</span> Leve a Opção ${o}</p><p class="sub">${Math.round(dif * 100)}% mais barata por ${base}</p>${nums}`;
            anuncio = `Leve a opção ${o}`;
        }
    }

    res.innerHTML = html;

    if (anuncio !== ultimo) { $('#anuncio').textContent = anuncio; ultimo = anuncio; }
}

OPC.forEach(o => {
    el('p', o).addEventListener('input', e => {
        const c = parseInt(e.target.value.replace(/\D/g, '').slice(0, 7) || '0', 10);
        e.target.dataset.c = c;
        e.target.value = c ? (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

        calc();
    });

    el('t', o).addEventListener('input', e => { e.target.value = e.target.value.replace(/[^\d.,]/g, ''); calc(); });
    el('q', o).addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3); calc(); });
    el('u', o).addEventListener('change', calc);
    el('pk', o).addEventListener('click', () => {
        const box = el('pkbox', o), abrir = box.hidden, btn = el('pk', o);

        box.hidden = !abrir;
        btn.setAttribute('aria-expanded', abrir);
        btn.textContent = abrir ? '− Não é pack' : '+ É pack? (várias unidades)';

        if (abrir) el('q', o).select(); else el('q', o).value = 1;
        calc();
    });
});

$$('.seg button').forEach(b => b.addEventListener('click', () => setCat(b.dataset.cat)));

$('#limpar').addEventListener('click', () => {
    OPC.forEach(o => {
        el('p', o).value = ''; el('p', o).dataset.c = 0; el('t', o).value = ''; el('q', o).value = 1;
        el('pkbox', o).hidden = true;
        el('pk', o).textContent = '+ É pack? (várias unidades)';
        el('pk', o).setAttribute('aria-expanded', 'false');
    });

    setCat(cat);
    el('p', 'A').focus();
});
setCat(cat);

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}