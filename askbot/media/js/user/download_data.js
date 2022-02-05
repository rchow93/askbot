(function() {
    var interval;

    var getBackupFileUrl = function (fileName) {
        var url = askbot.urls.downloadUserData;
        return url.replace('file_name', fileName);
    };

    var updateUi = function (fileName) {
      var backupLinks = $('#data-backups');
      var url = getBackupFileUrl(fileName);
      var newLink = $(
        '<li style="display: none;"><a href="' + url + '">' + 
        fileName + '</a></li>'
      );
      $('#data-backups-container').show();
      backupLinks.append(newLink);
      newLink.fadeIn();
      $('#exporting').fadeOut();
    };

    var checkForNewBackup = function () {
        $.ajax({
            type: 'GET',
            data: {'user_id': askbot.data.userId},
            dataType: 'json',
            url: askbot.urls.getTodaysBackupFileName,
            cache: false,
            success: function(data) {
                if (data.file_name) {
                    updateUi(data.file_name);
                    clearInterval(interval);
                }
            }
        });
    };
    if (askbot.data.isExportingData) {
        interval = setInterval(checkForNewBackup, 3000);
    }
})();
