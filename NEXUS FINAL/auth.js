(() => {
    "use strict";

    /* ==============================
       NEXUS AUTH SYSTEM
       ============================== */

    const style = document.createElement("style");

    style.textContent = `
        #nexusAuth {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(3,7,12,.96);
        }

        #nexusAuthBox {
            width: 360px;
            max-width: 90%;
            padding: 28px;
            border: 1px solid #1c7583;
            border-radius: 12px;
            background: #0b1017;
            box-shadow: 0 0 40px rgba(0,217,245,.12);
        }

        #nexusAuthBox h2 {
            margin: 0 0 6px;
            color: #00d9f5;
            letter-spacing: 4px;
        }

        #nexusAuthBox p {
            color: #718092;
            font-size: 12px;
        }

        #nexusAuthBox input {
            box-sizing: border-box;
            width: 100%;
            height: 42px;
            margin-top: 9px;
            padding: 0 12px;
            border: 1px solid #1c2530;
            border-radius: 7px;
            outline: none;
            background: #080c12;
            color: white;
        }

        #nexusAuthBox input:focus {
            border-color: #00d9f5;
        }

        #nexusAuthBox button {
            width: 100%;
            height: 42px;
            margin-top: 12px;
            border: 0;
            border-radius: 7px;
            background: #00d9f5;
            color: #061016;
            font-weight: bold;
            cursor: pointer;
        }

        #nexusAuthBox button:hover {
            opacity: .9;
        }

        #authSwitch {
            background: #111720 !important;
            color: #00d9f5 !important;
            border: 1px solid #1c2530 !important;
        }

        #authError {
            color: #ff7777;
            font-size: 11px;
            min-height: 18px;
            margin-top: 10px;
        }

        #nexusAccount {
            position: fixed;
            top: 15px;
            right: 18px;
            z-index: 5000;
            padding: 8px 12px;
            border: 1px solid #1c2530;
            border-radius: 7px;
            background: #0b1017;
            color: #00d9f5;
            font-size: 10px;
            cursor: pointer;
        }

        #nexusAdmin {
            position: fixed;
            inset: 0;
            z-index: 99998;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(3,7,12,.96);
        }

        #adminBox {
            width: 600px;
            max-width: 92%;
            max-height: 80vh;
            overflow: auto;
            padding: 25px;
            border: 1px solid #1c7583;
            border-radius: 12px;
            background: #0b1017;
        }

        #adminBox h2 {
            margin-top: 0;
            color: #00d9f5;
        }

        .adminUser {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            padding: 12px;
            margin-top: 8px;
            border: 1px solid #1c2530;
            border-radius: 7px;
            color: white;
        }

        .adminUser button {
            padding: 7px 12px;
            border: 1px solid #1c7583;
            border-radius: 6px;
            background: #10252b;
            color: #00d9f5;
            cursor: pointer;
        }

        .adminUser button:disabled {
            opacity: .6;
            cursor: not-allowed;
        }

        .adminButtons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .adminButtons button {
            flex: 1;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
        }

        #adminClose {
            background: #111720;
            color: #00d9f5;
            border: 1px solid #1c2530;
        }

        #adminLogout {
            background: #2a1111;
            color: #ff5c5c;
            border: 1px solid #7a2525;
        }
    `;

    document.head.appendChild(style);


    /* ==============================
       LOGIN / REGISTER SCREEN
       ============================== */

    const auth = document.createElement("div");
    auth.id = "nexusAuth";

    auth.innerHTML = `
        <div id="nexusAuthBox">

            <h2>NEXUS</h2>

            <p id="authTitle">
                COMMAND SYSTEM • GİRİŞ
            </p>

            <input
                id="authUsername"
                type="text"
                placeholder="Kullanıcı adı"
                autocomplete="username"
            >

            <input
                id="authPassword"
                type="password"
                placeholder="Şifre"
                autocomplete="current-password"
            >

            <div id="authError"></div>

            <button id="authButton">
                GİRİŞ YAP
            </button>

            <button id="authSwitch">
                HESAP OLUŞTUR
            </button>

        </div>
    `;

    document.body.appendChild(auth);


    /* ==============================
       ACCOUNT BUTTON
       ============================== */

    const account = document.createElement("div");

    account.id = "nexusAccount";
    account.style.display = "none";

    document.body.appendChild(account);


    /* ==============================
       ADMIN PANEL
       ============================== */

    const admin = document.createElement("div");

    admin.id = "nexusAdmin";

    admin.innerHTML = `
        <div id="adminBox">

            <h2>NEXUS ADMIN</h2>

            <p style="color:#718092">
                Kullanıcılar ve PRO yönetimi
            </p>

            <div style="display:flex; gap:8px; margin-top:10px;">
                <input
                    id="quickProUsername"
                    type="text"
                    placeholder="Kullanıcı adı yaz..."
                    style="flex:1; height:38px; padding:0 10px; border:1px solid #1c2530; border-radius:7px; background:#080c12; color:white; outline:none;"
                >
                <button
                    id="quickProButton"
                    style="padding:0 14px; border:0; border-radius:7px; background:#00d9f5; color:#061016; font-weight:bold; cursor:pointer;"
                >
                    PRO VER
                </button>
            </div>

            <div id="quickProMsg" style="font-size:11px; min-height:16px; margin-top:6px; color:#ff7777;"></div>

            <div id="adminUsers">
                Yükleniyor...
            </div>

            <div class="adminButtons">

                <button id="adminClose">
                    KAPAT
                </button>

                <button id="adminLogout">
                    ÇIKIŞ YAP
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(admin);


    /* ==============================
       VARIABLES
       ============================== */

    let registerMode = false;
    let me = null;

    const error =
        document.getElementById("authError");

    const usernameInput =
        document.getElementById("authUsername");

    const passwordInput =
        document.getElementById("authPassword");

    const authButton =
        document.getElementById("authButton");

    const authSwitch =
        document.getElementById("authSwitch");


    /* ==============================
       API REQUEST
       ============================== */

    async function request(url, options = {}) {

        const response = await fetch(url, {
            credentials: "include",
            ...options
        });

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "İşlem başarısız."
            );
        }

        return data;
    }


    /* ==============================
       AUTH UI
       ============================== */

    function showAuth() {

        auth.style.display = "flex";

        account.style.display = "none";

        admin.style.display = "none";
    }


    function hideAuth() {

        auth.style.display = "none";
    }


    /* ==============================
       LOGIN / REGISTER
       ============================== */

    async function login() {

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;

        error.textContent = "";

        if (!username || !password) {

            error.textContent =
                "Kullanıcı adı ve şifre gerekli.";

            return;
        }

        authButton.disabled = true;

        try {

            /* REGISTER */

            if (registerMode) {

                await request("https://YOUR-BACKEND-URL.onrender.com/api/register", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        password
                    })
                });

                registerMode = false;

                document.getElementById(
                    "authTitle"
                ).textContent =
                    "COMMAND SYSTEM • GİRİŞ";

                authButton.textContent =
                    "GİRİŞ YAP";

                authSwitch.textContent =
                    "HESAP OLUŞTUR";

                error.style.color =
                    "#00d9f5";

                error.textContent =
                    "Hesap oluşturuldu. Şimdi giriş yap.";

                passwordInput.value = "";

                return;
            }


            /* LOGIN */

            await request("https://YOUR-BACKEND-URL.onrender.com/api/login", {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    username,
                    password
                })
            });


            await loadMe();

        } catch (e) {

            error.style.color =
                "#ff7777";

            error.textContent =
                e.message;

        } finally {

            authButton.disabled = false;
        }
    }


    /* ==============================
       LOAD CURRENT USER
       ============================== */

    async function loadMe() {

        try {

            const data =
                await request("https://YOUR-BACKEND-URL.onrender.com/api/me");

            /*
             * EN ÖNEMLİ KISIM:
             * Backend logged_in false döndürürse
             * kullanıcı giriş yapmış sayılmaz.
             */

            if (!data.logged_in) {

                me = null;

                window.NEXUS_USER = null;

                showAuth();

                return;
            }


            /* USER LOGGED IN */

            me = data;

            window.NEXUS_USER = data;

            hideAuth();

            account.style.display =
                "block";


            /* ACCOUNT TEXT */

            account.textContent =
                data.username +
                (data.pro
                    ? " ⭐ PRO"
                    : "") +
                (data.admin
                    ? " 👑"
                    : "");


            /* ADMIN */

            if (data.admin) {

                account.onclick =
                    openAdmin;

            }

            /* NORMAL USER */

            else {

                account.onclick =
                    logout;

            }

        } catch (e) {

            me = null;

            window.NEXUS_USER = null;

            showAuth();
        }
    }


    /* ==============================
       LOGOUT
       ============================== */

    async function logout() {

        const confirmed =
            confirm(
                "Çıkış yapmak istiyor musun?"
            );

        if (!confirmed) {
            return;
        }

        try {

            await request(
                "https://YOUR-BACKEND-URL.onrender.com/api/logout",
                {
                    method: "POST"
                }
            );

        } catch (e) {

            console.error(
                "Logout error:",
                e
            );

        } finally {

            me = null;

            window.NEXUS_USER = null;

            location.reload();
        }
    }


    /* ==============================
       ADMIN PANEL
       ============================== */

    async function openAdmin() {

        if (!me || !me.admin) {
            return;
        }

        admin.style.display =
            "flex";

        const list =
            document.getElementById(
                "adminUsers"
            );

        list.innerHTML =
            "Yükleniyor...";

        try {

            const users =
                await request(
                    "https://YOUR-BACKEND-URL.onrender.com/api/users"
                );

            list.innerHTML = "";


            if (!users.length) {

                list.textContent =
                    "Kullanıcı bulunamadı.";

                return;
            }


            users.forEach(user => {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "adminUser";


                const info =
                    document.createElement(
                        "span"
                    );

                info.textContent =
                    user.username +
                    (user.pro
                        ? " ⭐ PRO"
                        : "");


                const button =
                    document.createElement(
                        "button"
                    );


                /* ADMIN */

                if (
                    user.username ===
                    "ADMIN"
                ) {

                    button.textContent =
                        "ADMIN";

                    button.disabled =
                        true;

                }

                /* NORMAL USER */

                else {

                    button.textContent =
                        user.pro
                            ? "PRO'YU KALDIR"
                            : "PRO VER";


                    button.onclick =
                        async () => {

                            button.disabled =
                                true;

                            try {

                                await request(
                                    "https://YOUR-BACKEND-URL.onrender.com/api/pro",
                                    {
                                        method:
                                            "POST",

                                        headers: {
                                            "Content-Type":
                                                "application/json"
                                        },

                                        body:
                                            JSON.stringify({
                                                username:
                                                    user.username,

                                                pro:
                                                    !user.pro
                                            })
                                    }
                                );

                                await openAdmin();

                            } catch (e) {

                                alert(
                                    e.message
                                );

                                button.disabled =
                                    false;
                            }
                        };
                }


                row.appendChild(info);

                row.appendChild(button);

                list.appendChild(row);
            });

        } catch (e) {

            list.textContent =
                e.message;
        }
    }


    /* ==============================
       CLOSE ADMIN
       ============================== */

    const quickProButton = document.getElementById("quickProButton");
    const quickProUsername = document.getElementById("quickProUsername");
    const quickProMsg = document.getElementById("quickProMsg");

    if (quickProButton) {
        quickProButton.onclick = async () => {
            const username = quickProUsername.value.trim();

            quickProMsg.style.color = "#ff7777";
            quickProMsg.textContent = "";

            if (!username) {
                quickProMsg.textContent = "Kullanıcı adı gir.";
                return;
            }

            quickProButton.disabled = true;

            try {
                await request("https://YOUR-BACKEND-URL.onrender.com/api/pro", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, pro: true })
                });

                quickProMsg.style.color = "#00d9f5";
                quickProMsg.textContent = username + " artık PRO.";

                quickProUsername.value = "";

                await openAdmin();

            } catch (e) {
                quickProMsg.textContent = e.message;
            } finally {
                quickProButton.disabled = false;
            }
        };
    }


    document
        .getElementById("adminClose")
        .onclick = () => {

            admin.style.display =
                "none";
        };


    /* ==============================
       ADMIN LOGOUT
       ============================== */

    document
        .getElementById("adminLogout")
        .onclick = logout;


    /* ==============================
       LOGIN BUTTON
       ============================== */

    authButton.onclick =
        login;


    /* ==============================
       REGISTER SWITCH
       ============================== */

    authSwitch.onclick = () => {

        registerMode =
            !registerMode;

        error.textContent =
            "";

        error.style.color =
            "#ff7777";


        if (registerMode) {

            document.getElementById(
                "authTitle"
            ).textContent =
                "COMMAND SYSTEM • KAYIT";

            authButton.textContent =
                "HESAP OLUŞTUR";

            authSwitch.textContent =
                "GİRİŞ YAP";

            passwordInput.autocomplete =
                "new-password";

        } else {

            document.getElementById(
                "authTitle"
            ).textContent =
                "COMMAND SYSTEM • GİRİŞ";

            authButton.textContent =
                "GİRİŞ YAP";

            authSwitch.textContent =
                "HESAP OLUŞTUR";

            passwordInput.autocomplete =
                "current-password";
        }
    };


    /* ==============================
       ENTER KEY
       ============================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                auth.style.display !== "none"
            ) {

                login();
            }
        }
    );


    /* ==============================
       START
       ============================== */

    showAuth();

    loadMe();

})();
