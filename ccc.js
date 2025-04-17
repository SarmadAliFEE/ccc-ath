(() => {
  console.log("CCC: Restoration script loaded.");

  function restoreBtn() {
    const btn = document.querySelector(
      'a.profile-header-social-count[href*="/friends"]'
    );
    if (!btn) return;
    console.log("CCC: Restoring button");
    btn.removeAttribute("style");
    btn.removeAttribute("disabled");
    btn.tabIndex = 0;
    btn.style.pointerEvents = "auto";
    btn.style.cursor = "pointer";
    try {
      const url = new URL(btn.href);
      const userId = url.pathname.split("/")[2];
      btn.href = `${url.origin}/users/${userId}/friends`;
      console.log("CCC: Button restored");
    } catch (e) {
      console.error("CCC: Failed to clean button href", e);
    }
  }

  restoreBtn();
  new MutationObserver(restoreBtn).observe(document.body, {
    childList: true,
    subtree: true,
  });

  const userId = window.location.pathname.split("/")[2];

  async function fetchHomies(cursor = null, collected = []) {
    const url = new URL(
      `https://friends.roblox.com/v1/users/${userId}/friends`
    );
    url.searchParams.set("limit", 100);
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url);
    const json = await res.json();
    collected.push(...(json.data || []));
    return json.nextPageCursor
      ? fetchHomies(json.nextPageCursor, collected)
      : collected;
  }

  async function fetchMugshots(userIds) {
    const map = {};
    const chungusSize = 100;
    for (let i = 0; i < userIds.length; i += chungusSize) {
      const chungus = userIds.slice(i, i + chungusSize);
      console.log("CCC: Fetching mugshots for IDs");
      const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${chungus.join(
        ","
      )}&size=150x150&format=Png&isCircular=false&thumbnailType=HeadShot`;
      const res = await fetch(url);
      const json = await res.json();
      (json.data || []).forEach((entry) => {
        map[entry.targetId] = entry.imageUrl;
      });
    }
    return map;
  }

  async function renderHomies(x, parent) {
    console.log(`CCC: Rendering homies`);
    let cuntainer = document.querySelector("ul.hlist.avatar-cards");
    if (!cuntainer) {
      cuntainer = document.createElement("ul");
      cuntainer.className = "hlist avatar-cards";
      parent.appendChild(cuntainer);
    }
    cuntainer.innerHTML = " <h1>Restored by CCC</h1> ";
    const thumbnails = await fetchMugshots(x.map((f) => f.id));
    x.forEach((f) => {
      const li = document.createElement("li");
      li.id = f.id;
      li.className = "list-item avatar-card";
      li.innerHTML = `
        <div class="avatar-card-container">
          <div class="avatar-card-content">
            <div class="avatar avatar-card-fullbody">
              <a href="/users/${f.id}/profile" class="avatar-card-link">
                <span class="thumbnail-2d-container avatar-card-image">
                  <img src="${thumbnails[f.id]}" alt="${
        f.name
      }'s avatar" title="${f.name}">
                </span>
              </a>
              <div class="avatar-status"></div>
            </div>
            <div class="avatar-card-caption">
              <span>
                <div class="avatar-name-container">
                  <a href="/users/${
                    f.id
                  }/profile" class="text-overflow avatar-name">${
        f.displayName
      }</a>
                </div>
                <div class="avatar-card-label">@${f.name}</div>
                <div class="avatar-card-label">Offline</div>
              </span>
            </div>
          </div>
        </div>
      `;
      cuntainer.appendChild(li);
    });
  }

  const initialUL = document.querySelector("ul.hlist.avatar-cards");
  if (initialUL) {
    console.log("CCC: Found initial container, populating");
    fetchHomies()
      .then((f) => renderHomies(f, initialUL.parentNode))
      .catch((e) => console.error("CCC fetch error", e));
  }

  // This is used to check if the friends list access is blocked or not
  const obs = new MutationObserver((mutations, observer) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (
          node.nodeType === 1 &&
          node.textContent.includes("No results found")
        ) {
          console.log(
            "CCC: 'No results found' detected, checking for existing restore button."
          );

          const parent = node.parentNode;

          // HOTFIX
          if (document.getElementById("ccc-restore-btn")) {
            return;
          }

          const cccBtn = document.createElement("button");
          cccBtn.id = "ccc-restore-btn";
          cccBtn.textContent = "Press to restore";
          cccBtn.style.position = "relative";
          cccBtn.style.padding = "10px 20px";
          cccBtn.style.margin = "10px 0";
          cccBtn.style.fontSize = "16px";
          cccBtn.style.backgroundColor = "black";
          cccBtn.style.color = "#fff";
          cccBtn.style.borderRadius = "8px";
          cccBtn.style.cursor = "pointer";

          cccBtn.onclick = () => {
            node.remove();
            cccBtn.remove();
            fetchHomies()
              .then((f) => renderHomies(f, parent))
              .catch((e) =>
                console.error("CCC: Fetch error report to Mr Baddiet: ", e)
              );
            observer.disconnect();
          };

          parent.insertBefore(cccBtn, parent.firstChild);
          return;
        }
      }
    }
  });

  obs.observe(document.body, { childList: true, subtree: true });
})();
