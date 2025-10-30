const inventoryData = [
  {
    store: '渋谷店',
    products: [
      {
        name: 'プレミアムコーヒー豆 200g',
        bookStock: 120,
        physicalStock: 108,
        unitPrice: 980,
        note: '閉店後の廃棄が原因と推測'
      },
      {
        name: 'オーガニックグラノーラ',
        bookStock: 80,
        physicalStock: 86,
        unitPrice: 780,
        note: '棚卸時点で未入荷分を計上'
      },
      {
        name: '抹茶ラテベース',
        bookStock: 60,
        physicalStock: 52,
        unitPrice: 650,
        note: '試飲提供による使用'
      }
    ]
  },
  {
    store: '横浜店',
    products: [
      {
        name: 'クラフトティーシロップ',
        bookStock: 70,
        physicalStock: 68,
        unitPrice: 890,
        note: '輸送中の破損報告あり'
      },
      {
        name: 'プレミアムコーヒー豆 200g',
        bookStock: 95,
        physicalStock: 90,
        unitPrice: 980,
        note: '棚卸ミスの疑い'
      }
    ]
  },
  {
    store: '名古屋店',
    products: [
      {
        name: '低温熟成クロワッサン生地',
        bookStock: 150,
        physicalStock: 155,
        unitPrice: 420,
        note: '入荷処理のタイムラグ'
      },
      {
        name: '濃厚チーズケーキ',
        bookStock: 48,
        physicalStock: 44,
        unitPrice: 540,
        note: '試食提供イベントに使用'
      }
    ]
  }
];

const tableBody = document.getElementById('inventoryTable');
const storeFilter = document.getElementById('storeFilter');
const lossFilter = document.getElementById('lossFilter');

const totalLossEl = document.getElementById('totalLoss');
const storesWithLossEl = document.getElementById('storesWithLoss');
const averageLossRateEl = document.getElementById('averageLossRate');

function formatCurrency(value) {
  return `¥${value.toLocaleString('ja-JP')}`;
}

function calculateLoss(book, physical) {
  return book - physical;
}

function lossRate(book, physical) {
  if (book === 0) return 0;
  return ((book - physical) / book) * 100;
}

function renderFilters() {
  const stores = inventoryData.map((entry) => entry.store);
  stores.forEach((store) => {
    const option = document.createElement('option');
    option.value = store;
    option.textContent = store;
    storeFilter.append(option);
  });
}

function buildRow(storeName, product) {
  const row = document.createElement('tr');
  const diff = calculateLoss(product.bookStock, product.physicalStock);
  const lossRateValue = lossRate(product.bookStock, product.physicalStock);
  const lossClass = diff > 0 ? 'loss-positive' : diff < 0 ? 'loss-negative' : '';
  const diffPrefix = diff > 0 ? '−' : diff < 0 ? '+' : '';
  const diffDisplay = `${diffPrefix}${Math.abs(diff).toLocaleString('ja-JP')} 個`;

  row.innerHTML = `
    <td data-label="店舗">${storeName}</td>
    <td data-label="商品">${product.name}</td>
    <td class="numeric" data-label="帳簿在庫">${product.bookStock.toLocaleString('ja-JP')} 個</td>
    <td class="numeric" data-label="実在庫">${product.physicalStock.toLocaleString('ja-JP')} 個</td>
    <td class="numeric ${lossClass}" data-label="差分">${diffDisplay}</td>
    <td class="numeric" data-label="ロス率">
      <span class="loss-chip ${lossRateValue > 0 ? 'positive' : lossRateValue < 0 ? 'negative' : ''}">
        ${lossRateValue > 0 ? 'ロス' : lossRateValue < 0 ? '過剰' : '一致'}
        ${lossRateValue === 0 ? '' : Math.abs(lossRateValue).toFixed(1) + '%'}
      </span>
    </td>
    <td data-label="備考">${product.note}</td>
  `;

  return row;
}

function flattenData() {
  const rows = [];
  inventoryData.forEach((entry) => {
    entry.products.forEach((product) => {
      rows.push({ store: entry.store, ...product });
    });
  });
  return rows;
}

function renderTable() {
  tableBody.innerHTML = '';
  const rows = flattenData().filter((row) => {
    const diff = calculateLoss(row.bookStock, row.physicalStock);
    const storeMatch = storeFilter.value === 'all' || row.store === storeFilter.value;
    const statusMatch =
      lossFilter.value === 'all' ||
      (lossFilter.value === 'positive' && diff > 0) ||
      (lossFilter.value === 'negative' && diff < 0);

    return storeMatch && statusMatch;
  });

  rows.forEach((row) => {
    tableBody.append(buildRow(row.store, row));
  });
}

function renderOverview() {
  let totalLossAmount = 0;
  const storeSet = new Set();
  let rateAccumulator = 0;
  let rateCount = 0;

  inventoryData.forEach((entry) => {
    let storeHasLoss = false;

    entry.products.forEach((product) => {
      const diff = calculateLoss(product.bookStock, product.physicalStock);
      if (diff !== 0) {
        storeHasLoss = true;
      }

      if (diff > 0) {
        totalLossAmount += diff * product.unitPrice;
      }

      const rate = lossRate(product.bookStock, product.physicalStock);
      if (rate !== 0) {
        rateAccumulator += Math.abs(rate);
        rateCount += 1;
      }
    });

    if (storeHasLoss) {
      storeSet.add(entry.store);
    }
  });

  totalLossEl.textContent = formatCurrency(totalLossAmount);
  storesWithLossEl.textContent = `${storeSet.size} 店舗`;
  averageLossRateEl.textContent = rateCount > 0 ? `${(rateAccumulator / rateCount).toFixed(1)}%` : '0%';
}

storeFilter.addEventListener('change', renderTable);
lossFilter.addEventListener('change', renderTable);

renderFilters();
renderOverview();
renderTable();
