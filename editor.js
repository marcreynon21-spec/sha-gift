/* =========================================================
   THE EDITOR

   Fills the form from content.js, collects whatever is changed,
   then packs the whole website into a zip.

   It has to read index.html, style.css and the rest to put them
   in the zip, and a browser only allows that when the page is
   served over http. Opened straight from a folder it will say so
   rather than fail quietly.
========================================================= */

(function () {

    "use strict";

    // Files copied into the zip untouched
    const SITE_FILES = [
        "index.html",
        "style.css",
        "script.js",
        "edit.html",
        "editor.css",
        "editor.js",
        "fonts/Sniglet-Regular.ttf",
        "fonts/Sniglet-ExtraBold.ttf",
        "images/Ribbon.png",
        "images/garden.jpg",
        "images/loopy.jpg",
        "images/photo1.jpg",
        "images/photo2.jpg"
    ];

    // The 16 tulips. The stickers and songs are added later from
    // content.js, since how many there are can change.
    for (let i = 1; i <= 16; i++) {
        SITE_FILES.push("images/flower" + i + ".svg");
    }

    const TOTAL_SONGS = 5;
    // Follows content.js, so changing the number there is enough
    const TOTAL_STICKERS = ((window.GIFT_CONTENT || {}).stickers || {}).images
        ? window.GIFT_CONTENT.stickers.images.length
        : 9;
    const TOTAL_FLOWERS = 16;

    // A deep copy, so editing never touches the original defaults
    const content = JSON.parse(JSON.stringify(window.GIFT_CONTENT || {}));

    // Files the user picked: path inside the zip -> File object
    const newFiles = {};


    /* =====================================================
       READING AND WRITING content BY PATH
    ===================================================== */

    function get(path) {

        return path.split(".").reduce(function (obj, key) {
            return (obj === undefined || obj === null) ? obj : obj[key];
        }, content);
    }


    function set(path, value) {

        const keys = path.split(".");
        const last = keys.pop();

        const target = keys.reduce(function (obj, key) {
            if (obj[key] === undefined) { obj[key] = {}; }
            return obj[key];
        }, content);

        target[last] = value;
    }


    /* =====================================================
       BUILDING THE FORM
    ===================================================== */

    // Every field marked with data-t is a plain piece of text
    function wireTextFields() {

        document.querySelectorAll("[data-t]").forEach(function (field) {

            const path = field.getAttribute("data-t");
            const value = get(path);

            field.value = (typeof value === "string") ? value : "";

            field.addEventListener("input", function () {
                set(path, field.value);
            });
        });
    }


    // A picture slot: shows what is there now, swaps on choose
    function wirePictureSlots() {

        document.querySelectorAll(".pic").forEach(function (slot) {

            const path = slot.getAttribute("data-pic");
            const zipName = slot.getAttribute("data-name");
            const preview = slot.querySelector(".pic-preview");
            const input = slot.querySelector("input[type=file]");
            const current = get(path);

            if (current) {
                preview.src = current;
            }

            input.addEventListener("change", function () {

                const file = input.files && input.files[0];

                if (!file) {
                    return;
                }

                // Keep the original extension so the browser still
                // knows what kind of picture it is
                const dot = file.name.lastIndexOf(".");
                const ext = dot > -1 ? file.name.slice(dot) : ".jpg";
                const target = zipName.replace(/\.[^.]+$/, ext);

                newFiles[target] = file;
                set(path, target);
                preview.src = URL.createObjectURL(file);
            });
        });
    }


    // The 16 flower messages
    function buildFlowerMessages() {

        const holder = document.getElementById("flowerMessages");
        const messages = get("garden.messages") || [];

        for (let i = 0; i < TOTAL_FLOWERS; i++) {

            const label = document.createElement("label");
            label.textContent = "Flower " + (i + 1);

            const input = document.createElement("input");
            input.value = messages[i] || "";

            input.addEventListener("input", function () {
                const list = get("garden.messages") || [];
                list[i] = input.value;
                set("garden.messages", list);
            });

            label.appendChild(input);
            holder.appendChild(label);
        }
    }


    // The letter, one box per line
    function buildLetterLines() {

        const holder = document.getElementById("letterLinesEdit");

        function addRow(text) {

            const row = document.createElement("input");
            row.className = "letter-row";
            row.value = text || "";
            row.addEventListener("input", collect);
            holder.appendChild(row);
        }

        function collect() {

            const lines = [];

            holder.querySelectorAll(".letter-row").forEach(function (row) {
                if (row.value.trim()) {
                    lines.push(row.value);
                }
            });

            set("letter.lines", lines);
        }

        (get("letter.lines") || []).forEach(addRow);

        document.getElementById("addLine").addEventListener("click", function () {
            addRow("");
            holder.lastChild.focus();
        });
    }


    // The 9 sticker pictures
    function buildStickerSlots() {

        const holder = document.getElementById("stickerPics");
        const images = get("stickers.images") || [];

        for (let i = 0; i < TOTAL_STICKERS; i++) {

            const slot = document.createElement("div");
            slot.className = "pic";
            slot.innerHTML =
                '<span class="pic-label">Sticker ' + (i + 1) + '</span>' +
                '<img class="pic-preview" alt="">' +
                '<input type="file" accept="image/*">';

            const preview = slot.querySelector(".pic-preview");
            const input = slot.querySelector("input");

            if (images[i]) {
                preview.src = images[i];
            }

            input.addEventListener("change", function () {

                const file = input.files && input.files[0];
                if (!file) { return; }

                const dot = file.name.lastIndexOf(".");
                const ext = dot > -1 ? file.name.slice(dot) : ".png";
                const target = "images/stickers/sticker" + (i + 1) + ext;

                newFiles[target] = file;

                const list = get("stickers.images") || [];
                list[i] = target;
                set("stickers.images", list);

                preview.src = URL.createObjectURL(file);
            });

            holder.appendChild(slot);
        }
    }


    // The 5 songs: title, artist and the audio file
    function buildSongRows() {

        const holder = document.getElementById("songs");
        const songs = get("music.songs") || [];

        for (let i = 0; i < TOTAL_SONGS; i++) {

            const song = songs[i] || {};

            const row = document.createElement("div");
            row.className = "song";
            row.innerHTML =
                "<h4>Song " + (i + 1) + "</h4>" +
                '<label>Title<input class="s-title"></label>' +
                '<label>Artist<input class="s-artist"></label>' +
                '<label class="full">Audio file (mp3 or m4a)' +
                '<input type="file" accept="audio/*" class="s-audio"></label>' +
                '<span class="chosen"></span>' +
                '<div class="pic full">' +
                  '<span class="pic-label">Cover shown while this song plays</span>' +
                  '<img class="pic-preview s-cover-preview" alt="">' +
                  '<input type="file" accept="image/*" class="s-cover">' +
                '</div>';

            const title = row.querySelector(".s-title");
            const artist = row.querySelector(".s-artist");
            const file = row.querySelector(".s-audio");
            const chosen = row.querySelector(".chosen");
            const cover = row.querySelector(".s-cover");
            const coverPreview = row.querySelector(".s-cover-preview");

            title.value = song.title || "";
            artist.value = song.artist || "";

            if (song.cover) {
                coverPreview.src = song.cover;
            }

            function save(key, value) {
                const list = get("music.songs") || [];
                list[i] = list[i] || {};
                list[i][key] = value;
                set("music.songs", list);
            }

            title.addEventListener("input", function () { save("title", title.value); });
            artist.addEventListener("input", function () { save("artist", artist.value); });

            file.addEventListener("change", function () {

                const picked = file.files && file.files[0];
                if (!picked) { return; }

                const dot = picked.name.lastIndexOf(".");
                const ext = dot > -1 ? picked.name.slice(dot) : ".mp3";
                const target = "music/song" + (i + 1) + ext;

                newFiles[target] = picked;
                save("file", target);

                chosen.textContent = "Using: " + picked.name +
                    " (" + Math.round(picked.size / 1024) + " KB)";
            });

            cover.addEventListener("change", function () {

                const picked = cover.files && cover.files[0];
                if (!picked) { return; }

                const dot = picked.name.lastIndexOf(".");
                const ext = dot > -1 ? picked.name.slice(dot) : ".jpg";
                const target = "images/cover" + (i + 1) + ext;

                newFiles[target] = picked;
                save("cover", target);

                coverPreview.src = URL.createObjectURL(picked);
            });

            holder.appendChild(row);
        }
    }


    /* =====================================================
       WRITING content.js BACK OUT
    ===================================================== */

    function contentFileText() {

        return "/* Written by edit.html. Open that page to change it again. */\n\n" +
               "window.GIFT_CONTENT = " + JSON.stringify(content, null, 4) + ";\n";
    }


    /* =====================================================
       A ZIP FILE, BUILT BY HAND

       Zip is a simple container: each file gets a small header
       followed by its bytes, then a directory of all of them at
       the end. Nothing is compressed here - the pictures and
       audio already are, so it would only cost time.
    ===================================================== */

    const crcTable = (function () {

        const table = new Uint32Array(256);

        for (let i = 0; i < 256; i++) {
            let c = i;
            for (let k = 0; k < 8; k++) {
                c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            }
            table[i] = c >>> 0;
        }

        return table;
    }());


    function crc32(bytes) {

        let c = 0xFFFFFFFF;

        for (let i = 0; i < bytes.length; i++) {
            c = crcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
        }

        return (c ^ 0xFFFFFFFF) >>> 0;
    }


    function makeZip(entries) {

        const chunks = [];
        const directory = [];
        let offset = 0;

        const enc = new TextEncoder();

        entries.forEach(function (entry) {

            const nameBytes = enc.encode(entry.name);
            const data = entry.bytes;
            const sum = crc32(data);

            // Local header
            const head = new DataView(new ArrayBuffer(30));
            head.setUint32(0, 0x04034b50, true);   // signature
            head.setUint16(4, 20, true);           // version needed
            head.setUint16(6, 0x0800, true);       // names are UTF-8
            head.setUint16(8, 0, true);            // stored, not deflated
            head.setUint16(10, 0, true);           // time
            head.setUint16(12, 0, true);           // date
            head.setUint32(14, sum, true);
            head.setUint32(18, data.length, true);
            head.setUint32(22, data.length, true);
            head.setUint16(26, nameBytes.length, true);
            head.setUint16(28, 0, true);

            chunks.push(new Uint8Array(head.buffer), nameBytes, data);

            // Matching entry for the directory at the end
            const dir = new DataView(new ArrayBuffer(46));
            dir.setUint32(0, 0x02014b50, true);
            dir.setUint16(4, 20, true);
            dir.setUint16(6, 20, true);
            dir.setUint16(8, 0x0800, true);
            dir.setUint16(10, 0, true);
            dir.setUint16(12, 0, true);
            dir.setUint16(14, 0, true);
            dir.setUint32(16, sum, true);
            dir.setUint32(20, data.length, true);
            dir.setUint32(24, data.length, true);
            dir.setUint16(28, nameBytes.length, true);
            dir.setUint16(30, 0, true);
            dir.setUint16(32, 0, true);
            dir.setUint16(34, 0, true);
            dir.setUint16(36, 0, true);
            dir.setUint32(38, 0, true);
            dir.setUint32(42, offset, true);

            directory.push(new Uint8Array(dir.buffer), nameBytes);

            offset += 30 + nameBytes.length + data.length;
        });

        const dirStart = offset;
        let dirSize = 0;
        directory.forEach(function (part) { dirSize += part.length; });

        const end = new DataView(new ArrayBuffer(22));
        end.setUint32(0, 0x06054b50, true);
        end.setUint16(4, 0, true);
        end.setUint16(6, 0, true);
        end.setUint16(8, entries.length, true);
        end.setUint16(10, entries.length, true);
        end.setUint32(12, dirSize, true);
        end.setUint32(16, dirStart, true);
        end.setUint16(20, 0, true);

        return new Blob(
            chunks.concat(directory, [new Uint8Array(end.buffer)]),
            { type: "application/zip" }
        );
    }


    /* =====================================================
       PUTTING THE DOWNLOAD TOGETHER
    ===================================================== */

    const statusBox = document.getElementById("status");

    function say(message, bad) {

        statusBox.hidden = false;
        statusBox.textContent = message;
        statusBox.classList.toggle("bad", !!bad);
    }


    async function fetchBytes(path) {

        const response = await fetch(path, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(path + " (" + response.status + ")");
        }

        return new Uint8Array(await response.arrayBuffer());
    }


    async function build() {

        const buttons = document.querySelectorAll(".build");
        buttons.forEach(function (b) { b.disabled = true; });

        try {
            const entries = [];
            const enc = new TextEncoder();

            // The freshly edited content
            entries.push({ name: "content.js", bytes: enc.encode(contentFileText()) });

            // Anything the user chose, straight from their computer
            const chosen = Object.keys(newFiles);

            for (const path of chosen) {
                const file = newFiles[path];
                entries.push({ name: path, bytes: new Uint8Array(await file.arrayBuffer()) });
            }

            // Everything else, copied from the site as it stands
            const alreadyAdded = new Set(entries.map(function (e) { return e.name; }));
            const copyList = SITE_FILES.slice();

            // Keep whichever stickers and songs were not replaced
            (get("stickers.images") || []).forEach(function (p) {
                if (p && !alreadyAdded.has(p)) { copyList.push(p); }
            });

            (get("music.songs") || []).forEach(function (song) {

                if (!song) { return; }

                if (song.file && !alreadyAdded.has(song.file)) {
                    copyList.push(song.file);
                }
                if (song.cover && !alreadyAdded.has(song.cover)) {
                    copyList.push(song.cover);
                }
            });

            [get("envelope.photo"), get("letter.photo1"), get("letter.photo2"),
             get("wish.photo")].forEach(function (p) {
                if (p && !alreadyAdded.has(p)) { copyList.push(p); }
            });

            let done = 0;
            const missing = [];

            for (const path of copyList) {

                if (alreadyAdded.has(path)) {
                    continue;
                }
                alreadyAdded.add(path);

                try {
                    entries.push({ name: path, bytes: await fetchBytes(path) });
                } catch (err) {
                    // A song that was never uploaded is expected to be
                    // absent; note it and carry on
                    missing.push(path);
                }

                done++;
                say("Packing... " + done + " of " + copyList.length);
            }

            const blob = makeZip(entries);
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "gift-website.zip";
            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(function () { URL.revokeObjectURL(url); }, 60000);

            let message = "Done. " + entries.length + " files, " +
                Math.round(blob.size / 1024) + " KB.";

            if (missing.length) {
                message += " Not found, so left out: " + missing.join(", ");
            }

            say(message, missing.length > 0);

        } catch (err) {
            say("Could not build the zip: " + err.message, true);

        } finally {
            buttons.forEach(function (b) { b.disabled = false; });
        }
    }


    /* =====================================================
       START
    ===================================================== */

    if (location.protocol === "file:") {
        document.getElementById("fileWarning").hidden = false;
    }

    wireTextFields();
    wirePictureSlots();
    buildFlowerMessages();
    buildLetterLines();
    buildStickerSlots();
    buildSongRows();

    document.querySelectorAll(".build").forEach(function (b) {
        b.addEventListener("click", build);
    });

}());
