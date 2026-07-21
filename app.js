// TODO: Replace with the deployed Google Apps Script Web App URL
const GAS_API_URL = "YOUR_GAS_WEB_APP_URL_HERE";

document.addEventListener('DOMContentLoaded', async () => {
    initMockData(); // Use mock data by default for demonstration until API is ready
    
    // To use real data, uncomment below and comment out initMockData()
    // await fetchData();
});

async function fetchData() {
    try {
        const response = await fetch(GAS_API_URL);
        const data = await response.json();
        
        updateUI(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('date-display').innerText = "데이터를 불러오는 중 오류가 발생했습니다.";
    }
}

// Fallback Mock Data for UI Testing
function initMockData() {
    const mockData = {
        currentMonth: {
            website: 45,
            naver: 20,
            kakao: 15,
            youtube: 5
        },
        previousMonth: {
            website: 40,
            naver: 25,
            kakao: 10,
            youtube: 3
        },
        lastUpdated: new Date().toLocaleDateString('ko-KR')
    };
    updateUI(mockData);
}

function updateUI(data) {
    // 1. Update Date
    document.getElementById('date-display').innerText = `마지막 업데이트: ${data.lastUpdated}`;

    // 2. Update Counts & Comparisons
    const platforms = ['website', 'naver', 'kakao', 'youtube'];
    
    platforms.forEach(platform => {
        const currentCount = data.currentMonth[platform];
        const previousCount = data.previousMonth[platform];
        
        // Count
        document.getElementById(`count-${platform}`).innerText = currentCount;
        
        // Comparison
        const compEl = document.getElementById(`comp-${platform}`);
        const diff = currentCount - previousCount;
        
        if (diff > 0) {
            compEl.innerText = `전월 대비: ▲ ${diff}`;
            compEl.className = 'comparison positive';
        } else if (diff < 0) {
            compEl.innerText = `전월 대비: ▼ ${Math.abs(diff)}`;
            compEl.className = 'comparison negative';
        } else {
            compEl.innerText = `전월 대비: - (변동 없음)`;
            compEl.className = 'comparison';
        }
    });

    // 3. Render Pie Chart
    renderChart(data.currentMonth);
}

let pieChartInstance = null;

function renderChart(currentMonthData) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    const data = {
        labels: ['홈페이지', '네이버 블로그', '카카오톡 채널', '유튜브'],
        datasets: [{
            data: [
                currentMonthData.website,
                currentMonthData.naver,
                currentMonthData.kakao,
                currentMonthData.youtube
            ],
            backgroundColor: [
                '#E73371', // Pink
                '#FFFFFF', // White
                'rgba(255, 255, 255, 0.6)', // Light White/Gray
                'rgba(231, 51, 113, 0.5)'  // Light Pink
            ],
            borderColor: '#000000', // Black border to match background
            borderWidth: 2,
            hoverOffset: 10
        }]
    };

    const config = {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#ffffff',
                        font: {
                            family: 'Paperlogy',
                            size: 14
                        }
                    }
                },
                tooltip: {
                    titleFont: { family: 'Paperlogy' },
                    bodyFont: { family: 'Paperlogy' }
                }
            }
        }
    };

    pieChartInstance = new Chart(ctx, config);
}
