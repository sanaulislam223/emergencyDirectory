const nationalHelplines = [
    { name: "राष्ट्रीय आपातकालीन सेवा (All-In-One)", number: "112", category: "Police" },
    { name: "एम्बुलेंस आपातकालीन सेवा (चिकित्सा)", number: "108", category: "Medical" },
    { name: "महिला सुरक्षा हेल्प लाइन (Women Line)", number: "1090", category: "Women" },
    { name: "राष्ट्रीय साइबर अपराध (Cyber Crime)", number: "1930", category: "Cyber" },
    { name: "चाइल्ड हेल्प लाईन (बाल सुरक्षा)", number: "1098", category: "Women" }
];

let userLat = null;
let userLon = null;
let currentCategory = "all";
let isGPSEnabled = true;

function toggleGPS() {
    isGPSEnabled = document.getElementById("gpsToggle").checked;
    const infoBox = document.getElementById("infoBox");
    if (isGPSEnabled) {
        infoBox.style.opacity = "1";
        trackLiveLocation();
    } else {
        infoBox.style.opacity = "0.6";
        resetLocationUI("ऑफलाइन", "ऑफलाइन", "टॉगल बंद है", "------");
        loadDirectory();
    }
}

// 📍 हाइब्रिड लाइव ट्रैकर (जीपीएस फेल होने पर यह तुरंत इंटरनेट नेटवर्क चालू कर देगा)
function trackLiveLocation() {
    if (!isGPSEnabled) return;

    if (!navigator.geolocation) {
        fetchIPLocation(); // जीपीएस न होने पर सीधे इंटरनेट नेटवर्क से खोजें
        return;
    }

    // जीपीएस रिस्पॉन्स के लिए केवल 3 सेकंड का समय दें, अन्यथा तुरंत नेटवर्क सर्च चालू करें
    const geoOptions = {
        enableHighAccuracy: true, 
        timeout: 3000,           
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            userLat = position.coords.latitude;
            userLon = position.coords.longitude;
            fetchAddressFromCoords(userLat, userLon);
        },
        (error) => {
            console.log("GPS Blocked/Timeout. Fetching via Internet Network...");
            fetchIPLocation(); // यदि आपके लैपटॉप का जीपीएस बंद है, तो यह बिना एरर के सीधे नेटवर्क से ढूंढेगा
        }, 
        geoOptions
    );
}

// 🌐 लाइव इंटरनेट नेटवर्क ट्रैकर (यह बिना जीपीएस के भी आपका सही एरिया तुरंत निकाल देगा)
async function fetchIPLocation() {
    try {
        const response = await fetch('https://ipapi.co');
        const data = await response.json();
        
        userLat = data.latitude;
        userLon = data.longitude;

        // यह आपके इंटरनेट नेटवर्क के अनुसार लाइव नाम सेट करेगा (जैसे मऊ या नागपुर)
        resetLocationUI(
            data.region || "उत्तर प्रदेश",
            data.city || "मऊ जिला",
            "स्थानीय क्षेत्र",
            data.postal || "275102"
        );

        document.getElementById("locationStatus").innerHTML = `<i class="fa-solid fa-network-wired"></i> नेटवर्क एक्टिव`;
        document.getElementById("locationStatus").className = "live-location-badge success";
        document.getElementById("directoryTitle").innerText = `आपातकालीन सेवाएं: ${data.city || 'आपके क्षेत्र'} के पास`;
        
        loadDirectory();
        } catch (e) {
        console.error("Network Fetch Failed", e);
        // 🚀 फिक्स 1: यहाँ से मऊ और अदरी का नाम हमेशा के लिए हटा दिया गया है
        resetLocationUI("भारत का राज्य", "आपका जिला", "स्थानीय क्षेत्र", "ऑटो-डिटेक्ट");
        loadDirectory();
    }
}

// जीपीएस कोऑर्डिनेट्स से बिल्कुल लाइव नाम (OpenStreetMap API) निकालने का फंक्शन
async function fetchAddressFromCoords(lat, lon) {
    try {
        const response = await fetch(`https://openstreetmap.org{lat}&lon=${lon}&addressdetails=1&accept-language=hi`);
        const data = await response.json();
        
        if (data.address) {
            const addr = data.address;
            
            // 🚀 फिक्स 2: पूरी तरह क्लीन और 100% ऑल-इंडिया डायनेमिक वैरियेबल्स
            const state = addr.state || "भारत का राज्य";
            const district = addr.district || addr.county || addr.state_district || "आपका जिला";
            const village = addr.village || addr.town || addr.suburb || addr.neighbourhood || addr.city || "स्थानीय क्षेत्र";
            const pincode = addr.postcode || "ऑटो-डिटेक्ट";

            resetLocationUI(state, district, village, pincode);
            
            document.getElementById("locationStatus").innerHTML = `<i class="fa-solid fa-circle-check"></i> GPS एक्टिव`;
            document.getElementById("locationStatus").className = "live-location-badge success";
            document.getElementById("directoryTitle").innerText = `आपातकालीन सेवाएं: ${village}, ${district} के लिए`;
        }
    } catch (error) {
        fetchIPLocation();
    }
    loadDirectory();
}


function resetLocationUI(state, district, village, pin) {
    document.getElementById("stateName").innerText = state;
    document.getElementById("districtName").innerText = district;
    document.getElementById("villageName").innerText = village;
    document.getElementById("pinCode").innerText = pin;
}

function loadDirectory() {
    const listContainer = document.getElementById('directoryList');
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    listContainer.innerHTML = '';

    if (userLat) {
        document.getElementById("nearestHub").innerHTML = `<i class="fa-solid fa-bolt"></i> लाइव सैटेलाइट ट्रैकर सक्रिय है। नीचे बटनों का उपयोग करें।`;
    }

    const filtered = nationalHelplines.filter(item => {
        const matchesCategory = currentCategory === "all" || item.category === currentCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchText);
        return matchesCategory && matchesSearch;
    });

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'contact-card';
        card.innerHTML = `
            <div class="contact-info">
                <h4>${item.name} <span class="distance-tag" style="background:#e2e8f0; color:#475569;">टोल-फ्री</span></h4>
                <p><i class="fa-solid fa-layer-group"></i> श्रेणी: ${item.category}</p>
                <p style="margin-top:4px;"><i class="fa-solid fa-phone-flip"></i> <strong>${item.number}</strong></p>
            </div>
            <a href="tel:${item.number}" class="call-btn">
                <i class="fa-solid fa-phone"></i>
            </a>
        `;
        listContainer.appendChild(card);
    });

    if (userLat) {
        const dynamicMapCards = document.createElement('div');
        dynamicMapCards.innerHTML = `
            <h3 class="live-map-grid-title"><i class="fa-solid fa-location-arrow"></i> आपके स्थान के अनुसार लाइव सुविधाएं:</h3>
            <div class="map-grid-container">
                <a href="https://google.com" target="_blank" class="map-link-btn" style="background:#0ea5e9;">
                    <i class="fa-solid fa-hospital"></i> नजदीकी अस्पताल खोजें
                </a>
                <a href="https://google.com" target="_blank" class="map-link-btn" style="background:#334155;">
                    <i class="fa-solid fa-building-shield"></i> नजदीकी थाना खोजें
                </a>
            </div>
            <div class="map-grid-container" style="margin-top:10px;">
                <a href="https://google.com" target="_blank" class="map-link-btn" style="background:#dc2626;">
                    <i class="fa-solid fa-droplet"></i> नजदीकी ब्लड बैंक
                </a>
                <a href="https://google.com" target="_blank" class="map-link-btn" style="background:#f97316;">
                    <i class="fa-solid fa-pills"></i> 24x7 मेडिकल स्टोर
                </a>
            </div>
        `;
        listContainer.appendChild(dynamicMapCards);
    }
}

function filterData() { loadDirectory(); }

function filterByCategory(category) {
    document.querySelectorAll('.cat-card').forEach(card => card.classList.remove('active'));
    if (currentCategory === category) {
        currentCategory = "all";
    } else {
        currentCategory = category;
        document.getElementById(`cat-${category}`).classList.add('active');
    }
    loadDirectory();
}

function triggerSOS() {
    alert("SOS सक्रिय! राष्ट्रीय आपातकालीन सेवा 112 डायल की जा रही है।");
    window.location.href = "tel:112";
}

window.onload = () => { trackLiveLocation(); };
