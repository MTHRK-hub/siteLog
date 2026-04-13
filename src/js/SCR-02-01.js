(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const currentUser = c.getCurrentUser();
  c.updateParentHeader({ screenId: "SCR-02-01", title: "メニュー", showUser: true });

  document.getElementById("link-friend-list").addEventListener("click", function () {
    c.navigate("friendList");
  });

  document.getElementById("link-site-list").addEventListener("click", function () {
    c.navigate("siteList");
  });

  document.getElementById("link-password-change").addEventListener("click", function () {
    c.navigate("passwordChange");
  });

  const btnUserCreate = document.getElementById("link-user-create");
  if (currentUser && currentUser.isAdmin) {
    btnUserCreate.removeAttribute("hidden");
  }
  btnUserCreate.addEventListener("click", function () {
    c.navigate("userCreate");
  });
})();
