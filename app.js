// TODO: Replace with the deployed Google Apps Script Web App URL
const GAS_API_URL = "YOUR_GAS_WEB_APP_URL_HERE";

let globalHistoryData = null;
let pieChartInstance = null;
let trendChartInstance = null;

// Utility for safe local date arithmetic
function getOffsetDateStr(dateStrOrObj, offsetDays) {
    let date;
    if (typeof dateStrOrObj === 'string') {
        const parts = dateStrOrObj.split('-');
        date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
        date = new Date(dateStrOrObj.getTime());
    }
    date.setDate(date.getDate() + offsetDays);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return ${yyyy}--;
}

document.addEventListener('DOMContentLoaded', async () => {
    setupDatePicker();
    
    // Attempt to fetch real data. If it fails or is not set, use mock data.
    if (GAS_API_URL !== "YOUR_GAS_WEB_APP_URL_HERE") {
        await fetchData();
    } else {
        initMockData();
    }
});

function setupDatePicker() {
    const dateInput = document.getElementById('date-select');
    
    // Set default to today (local)
    dateInput.value = getOffsetDateStr(new Date(), 0);
    
    // Listen to changes
    dateInput.addEventListener('change', (e) => {
        if (globalHistoryData) {
            updateUIForDate(e.target.value);
        }
    });
}

async function fetchData() {
    try {
        document.getElementById('date-display').innerText = "데이터 불러오는 중...";
        const response = await fetch(GAS_API_URL);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        globalHistoryData = data.history;
        document.getElementById('date-display').innerText = 마지막 동기화: ;
        
        const selectedDate = document.getElementById('date-select').value;
        updateUIForDate(selectedDate);
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('date-display').innerText = "데이터를 불러오는 중 오류가 발생했습니다. (가상 데이터 표시중)";
        initMockData();
    }
}

function initMockData() {
    // Generate some fake history for the last 60 days to today
    const history = {};
    const today = new Date();
    
    for(let i = 60; i >= 0; i--) {
        const dStr = getOffsetDateStr(today, -i);
        history[dStr] = {
            website: Math.floor(Math.random() * 5),
            naver: Math.floor(Math.random() * 3),
            kakao: Math.floor(Math.random() * 2),
            youtube: Math.floor(Math.random() * 2)
        };
    }
    
    globalHistoryData = history;
    document.getElementById('date-display').innerText = "가상 데이터 (API 연결 필요)";
    
    const selectedDate = document.getElementById('date-select').value;
    updateUIForDate(selectedDate);
}

function updateUIForDate(targetDateStr) {
    if (!globalHistoryData) return;
    
    // 1. Get Target Date Data
    const targetData = globalHistoryData[targetDateStr] || { website: 0, naver: 0, kakao: 0, youtube: 0 };
    
    // 2. Get Previous Day Data for comparison
    const prevDateStr = getOffsetDateStr(targetDateStr, -1);
    const prevData = globalHistoryData[prevDateStr] || { website: 0, naver: 0, kakao: 0, youtube: 0 };

    // 3. Update Counts & Comparisons
    const platforms = ['website', 'naver', 'kakao', 'youtube'];
    
    platforms.forEach(platform => {
        const currentCount = targetData[platform];
        const prevCount = prevData[platform];
        
        // Count
        document.getElementById(count-).innerText = currentCount;
        
        // Comparison
        const compEl = document.getElementById(comp-);
        const diff = currentCount - prevCount;
        
        if (diff > 0) {
            compEl.innerText = 전일 대비: ▲ ;
            compEl.className = 'comparison positive';
        } else if (diff < 0) {
            compEl.innerText = 전일 대비: ▼ ;
            compEl.className = 'comparison negative';
        } else {
            compEl.innerText = 전일 대비: - (변동 없음);
            compEl.className = 'comparison';
        }
    });

    // 4. Render Pie Chart
    renderPieChart(targetData);
    
    // 5. Render Trend Chart (Last 7 Days from target date)
    renderTrendChart(targetDateStr);
}

function renderPieChart(data) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    const chartData = {
        labels: ['홈페이지', '네이버 블로그', '카카오톡 채널', '유튜브'],
        datasets: [{
            data: [data.website, data.naver, data.kakao, data.youtube],
            backgroundColor: [
                '#E73371', // Pink
                '#F48FB1', // Light Pink
                '#FCE4EC', // Very Light Pink
                '#333333'  // Dark Gray
            ],
            borderWidth: 1,
            borderColor: '#ffffff',
            hoverOffset: 10
        }]
    };

    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#333333',
                        font: { family: 'Paperlogy', size: 13 }
                    }
                }
            }
        }
    });
}

function renderTrendChart(targetDateStr) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    if (trendChartInstance) {
        trendChartInstance.destroy();
    }
    
    // Build array of last 7 dates ending on targetDateStr
    const labels = [];
    const dataWebsite = [];
    const dataNaver = [];
    const dataKakao = [];
    const dataYoutube = [];
    
    for (let i = 6; i >= 0; i--) {
        const dStr = getOffsetDateStr(targetDateStr, -i);
        
        // Format for display (MM/DD)
        const parts = dStr.split('-');
        const displayLabel = ${Number(parts[1])}/;
        labels.push(displayLabel);
        
        const dData = globalHistoryData[dStr] || { website:0, naver:0, kakao:0, youtube:0 };
        dataWebsite.push(dData.website);
        dataNaver.push(dData.naver);
        dataKakao.push(dData.kakao);
        dataYoutube.push(dData.youtube);
    }
    
    trendChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '홈페이지',
                    data: dataWebsite,
                    backgroundColor: '#E73371',
                    borderRadius: 4
                },
                {
                    label: '네이버 블로그',
                    data: dataNaver,
                    backgroundColor: '#F48FB1',
                    borderRadius: 4
                },
                {
                    label: '카카오톡 채널',
                    data: dataKakao,
                    backgroundColor: '#FCE4EC',
                    borderRadius: 4
                },
                {
                    label: '유튜브',
                    data: dataYoutube,
                    backgroundColor: '#333333',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: true,
                    ticks: { precision: 0, font: { family: 'Paperlogy' } },
                    grid: { color: '#f0f0f0' }
                },
                x: {
                    stacked: true,
                    ticks: { font: { family: 'Paperlogy' } },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#333333',
                        font: { family: 'Paperlogy', size: 11 }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}
