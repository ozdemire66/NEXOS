const API = "https://YOUR-BACKEND-URL.onrender.com";

const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messages = document.getElementById("messages");

const micButton = document.getElementById("micButton");
const voiceToggle = document.getElementById("voiceToggle");
const voiceSelect = document.getElementById("voiceSelect");

let voiceEnabled =
    localStorage.getItem("nexusVoiceEnabled") !== "false";

let selectedVoice =
    localStorage.getItem("nexusVoice") ||
    "tr-TR-AhmetNeural";

let recognition = null;

let audioQueue = [];
let isPlayingAudio = false;
let currentAudio = null;


function addMessage(text, type = "nexus") {

    if (!messages) {
        console.log(text);
        return;
    }

    const div = document.createElement("div");

    div.className = "message " + type;

    div.textContent = text;

    messages.appendChild(div);

    messages.scrollTop = messages.scrollHeight;
}


function updateVoiceButton() {

    if (!voiceToggle) return;

    voiceToggle.textContent =
        voiceEnabled ? "🔊" : "🔇";

    voiceToggle.classList.toggle(
        "active",
        voiceEnabled
    );
}


function speak(text) {

    if (!voiceEnabled) return;

    if (!text || !text.trim()) return;

    audioQueue.push(text.trim());

    playNextAudio();
}


async function playNextAudio() {

    if (
        isPlayingAudio ||
        audioQueue.length === 0
    ) {
        return;
    }

    isPlayingAudio = true;

    const text = audioQueue.shift();

    try {

        const response = await fetch(
            API + "/api/speak",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    text: text,
                    voice: selectedVoice
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                "TTS HTTP " +
                response.status
            );
        }

        const type =
            response.headers.get(
                "content-type"
            ) || "";

        if (
            type.includes(
                "application/json"
            )
        ) {

            const data =
                await response.json();

            throw new Error(
                data.error ||
                "TTS hatası"
            );
        }

        const blob =
            await response.blob();

        if (!blob.size) {
            throw new Error(
                "Boş ses dosyası"
            );
        }

        const url =
            URL.createObjectURL(blob);

        const audio =
            new Audio(url);

        currentAudio = audio;

        audio.volume = 1.0;

        await new Promise(
            (resolve, reject) => {

                audio.onended =
                    resolve;

                audio.onerror =
                    () => reject(
                        new Error(
                            "Ses oynatılamadı."
                        )
                    );

                audio.play()
                    .catch(reject);
            }
        );

        URL.revokeObjectURL(url);

    } catch (error) {

        console.error(
            "NEXUS TTS:",
            error
        );

    } finally {

        currentAudio = null;

        isPlayingAudio = false;

        playNextAudio();
    }
}


async function sendMessage() {

    if (!input) return;

    const text =
        input.value.trim();

    if (!text) return;

    addMessage(text, "user");

    input.value = "";

    if (sendButton) {
        sendButton.disabled = true;
    }

    try {

        const response =
            await fetch(
                API + "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: text
                    })
                }
            );

        const data =
            await response.json();

        const reply =
            data.reply ||
            "Cevap alınamadı.";

        addMessage(
            reply,
            "nexus"
        );

        speak(reply);

    } catch (error) {

        console.error(error);

        const msg =
            "NEXUS backend'e bağlanamadı.";

        addMessage(
            msg,
            "nexus"
        );

    } finally {

        if (sendButton) {
            sendButton.disabled = false;
        }

        if (input) {
            input.focus();
        }
    }
}


if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );
}


if (input) {

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }
        }
    );
}


if (voiceToggle) {

    voiceToggle.addEventListener(
        "click",
        async () => {

            voiceEnabled =
                !voiceEnabled;

            localStorage.setItem(
                "nexusVoiceEnabled",
                voiceEnabled
            );

            updateVoiceButton();

            if (voiceEnabled) {

                speak(
                    "Sesli yanıt aktif."
                );
            }
        }
    );
}


if (voiceSelect) {

    voiceSelect.value =
        selectedVoice;

    voiceSelect.addEventListener(
        "change",
        () => {

            selectedVoice =
                voiceSelect.value;

            localStorage.setItem(
                "nexusVoice",
                selectedVoice
            );
        }
    );
}


function setupSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        console.warn(
            "Tarayıcı SpeechRecognition desteklemiyor."
        );

        return;
    }

    recognition =
        new SpeechRecognition();

    recognition.lang =
        "tr-TR";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;

    recognition.onresult =
        event => {

            const text =
                event.results[0][0].transcript;

            if (input) {
                input.value = text;
            }

            sendMessage();
        };

    recognition.onerror =
        error => {

            console.error(
                "MIC:",
                error
            );
        };

    recognition.onend =
        () => {

            if (micButton) {
                micButton.classList.remove(
                    "recording"
                );
            }
        };
}


if (micButton) {

    micButton.addEventListener(
        "click",
        () => {

            if (!recognition) {
                alert(
                    "Bu tarayıcı sesli komutu desteklemiyor."
                );
                return;
            }

            try {

                recognition.start();

                micButton.classList.add(
                    "recording"
                );

            } catch (error) {

                console.error(error);
            }
        }
    );
}


setupSpeechRecognition();
updateVoiceButton();

console.log(
    "NEXUS 4.0 frontend ONLINE"
);
