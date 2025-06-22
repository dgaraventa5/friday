function prioritizeAndScheduleTasks() {
    updateTaskScores();
  
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MasterTasks");
    const data = sheet.getDataRange().getValues();
    const header = data[0];
  
    const taskIndex = header.indexOf("Task");
    const categoryIndex = header.indexOf("Category");
    const statusIndex = header.indexOf("Status");
    const estimatedTimeIndex = header.indexOf("Estimated Time");
    const dateToCompleteIndex = header.indexOf("Date to Complete");
    const scoreIndex = header.indexOf("Score");
  
    const today = new Date();
    today.setHours(0, 0, 0, 0); // ✅ Normalize to midnight
  
    const allTasks = [];
  
    // Step 1: Reset Date to Complete if it's in the past (and task isn't Done)
    for (let i = 1; i < data.length; i++) {
      const status = data[i][statusIndex];
      const dateToComplete = new Date(data[i][dateToCompleteIndex]);
      if (
        status !== "Done" &&
        !isNaN(dateToComplete) &&
        dateToComplete < today
      ) {
        sheet.getRange(i + 1, dateToCompleteIndex + 1).setValue(""); // Clear the date
      }
    }
  
    // Step 2: Collect all active tasks
    for (let i = 1; i < data.length; i++) {
      const status = data[i][statusIndex];
      if (status !== "Done") {
        allTasks.push({
          rowNumber: i + 1,
          name: data[i][taskIndex],
          category: data[i][categoryIndex],
          estimatedTime: parseFloat(data[i][estimatedTimeIndex]) || 1,
          score: parseFloat(data[i][scoreIndex]) || 0
        });
      }
    }
  
    // Step 3: Sort by descending score
    allTasks.sort((a, b) => b.score - a.score);
  
    const dayBuckets = [];
    let unassignedTasks = [...allTasks];
    let day = 0;
  
    // Step 4: Daily caps
    const MAX_PER_DAY = 4;
    const LIMITS = {
      Work:  { min: 6, max: 10 },
      Home:  { min: 0, max: 3 },
      Health:{ min: 0, max: 3 }
    };
  
    // Step 5: Fill each day’s bucket
    while (unassignedTasks.length > 0) {
      const currentBucket = [];
      const categoryHours = {};
      let totalTasks = 0;
      let remaining = [];
  
      // 🔁 Calculate the actual date we’re scheduling for
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
  
      const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
  
      for (const task of unassignedTasks) {
        if (totalTasks >= MAX_PER_DAY) {
          remaining.push(task);
          continue;
        }
  
        const cat = task.category;
        const cap = LIMITS[cat] || { max: Infinity };
        const used = categoryHours[cat] || 0;
  
        // 🚫 Skip Work tasks on weekends
        if (isWeekend && cat === "Work") {
          remaining.push(task);
          continue;
        }
  
        if (used + task.estimatedTime <= cap.max) {
          currentBucket.push(task);
          categoryHours[cat] = used + task.estimatedTime;
          totalTasks++;
        } else {
          remaining.push(task);
        }
      }
  
      // If nothing could be scheduled, break out to avoid infinite loop
      if (currentBucket.length === 0 && unassignedTasks.length === remaining.length) {
        console.warn("⚠️ Could not schedule any remaining tasks — exiting loop.");
        break;
      }
  
      dayBuckets.push(currentBucket);
      unassignedTasks = remaining;
      day++;
    }
  
    // Step 6: Assign dates and statuses
    dayBuckets.forEach((bucket, dayOffset) => {
      const date = new Date(today); // ✅ fresh date from normalized base
      date.setDate(date.getDate() + dayOffset);
      let count = 0;
  
      for (const task of bucket) {
        sheet.getRange(task.rowNumber, dateToCompleteIndex + 1).setValue(date);
        const status = (dayOffset === 0 && count < MAX_PER_DAY) ? "In Progress" : "Not Started";
        sheet.getRange(task.rowNumber, statusIndex + 1).setValue(status);
        count++;
      }
    });
  
    // Step 7: Log schedule to GPT Responses tab
    const gptSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("GPT Responses");
    if (gptSheet) {
      const timestamp = new Date();
      let summary = "Auto-scheduled tasks:\n";
      dayBuckets.forEach((bucket, offset) => {
        const d = new Date(today);
        d.setDate(today.getDate() + offset);
        const iso = Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
        const names = bucket.map(t => t.name).join(", ");
        summary += `${iso}: ${names}\n`;
      });
      gptSheet.appendRow([timestamp, summary.trim()]);
    }
  }
  
  
  function updateTaskScores() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MasterTasks");
    const data = sheet.getDataRange().getValues();
    const header = data[0];
  
    const dueDateIndex = header.indexOf("Due Date");
    const daysOnListIndex = header.indexOf("Days on List");
    const importanceIndex = header.indexOf("Importance");
    const urgencyIndex = header.indexOf("Urgency");
    let scoreIndex = header.indexOf("Score");
  
    if (scoreIndex === -1) {
      scoreIndex = header.length;
      sheet.getRange(1, scoreIndex + 1).setValue("Score");
      header.push("Score");
    }
  
    const today = new Date();
    today.setHours(0,0,0,0);
  
    const scoreUpdates = [];
  
    for (let i = 1; i < data.length; i++) {
      const dueDate = new Date(data[i][dueDateIndex]);
      const rawDays = data[i][daysOnListIndex];
      const daysOnList = isNaN(parseInt(rawDays)) ? 0 : parseInt(rawDays);
      const importance = data[i][importanceIndex] === "Important" ? 10 : 0;
      const urgency = data[i][urgencyIndex] === "Urgent" ? 10 : 0;
  
      const daysUntilDue = (!isNaN(dueDate.getTime()))
        ? Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;
  
      let dueScore = 0;
      if (isFinite(daysUntilDue)) {
        if (daysUntilDue < 0) {
          dueScore = 50;
        } else if (daysUntilDue === 0) {
          dueScore = 40;
        } else if (daysUntilDue <= 3) {
          dueScore = 30;
        } else if (daysUntilDue <= 7) {
          dueScore = 20;
        } else {
          dueScore = 10;
        }
      }
  
      const daysOnListScore = Math.min(daysOnList * 2, 20);
  
      const newScore = dueScore + importance + urgency + daysOnListScore;
      scoreUpdates.push({row: i + 1, score: newScore});
    }
  
    if (scoreUpdates.length > 0) {
      scoreUpdates.forEach(update => {
        sheet.getRange(update.row, scoreIndex + 1).setValue(update.score);
      });
      Logger.log("Updated scores for %s tasks.", scoreUpdates.length);
    } else {
      Logger.log("No tasks to update scores for.");
    }
  }
  
  
  function archiveDoneTasks() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("MasterTasks");
    const archiveSheet = ss.getSheetByName("Archive") || ss.insertSheet("Archive");
  
    const data = sheet.getDataRange().getValues();
  
    if (archiveSheet.getLastRow() === 0) {
      archiveSheet.appendRow(data[0]);
    }
  
    for (let i = data.length - 1; i > 0; i--) {
      const header = data[0];
      const statusIndex = header.indexOf("Status");
      if (statusIndex === -1) {
        Logger.log("❌ Archive Done Tasks: 'Status' column not found in MasterTasks sheet.");
        return;
      }
  
      if (data[i][statusIndex] === "Done") {
        archiveSheet.appendRow(data[i]);
        sheet.deleteRow(i + 1);
      }
    }
    Logger.log("Archived done tasks.");
  }
  
  function markTaskDoneAndReprioritize(row) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const master = ss.getSheetByName("MasterTasks");
    const archive = ss.getSheetByName("Archive") || ss.insertSheet("Archive");
  
    const data = master.getDataRange().getValues();
    const headers = data[0];
    const statusIndex = headers.indexOf("Status");
    if (statusIndex === -1) {
      Logger.log("❌ Mark Task Done: 'Status' column not found.");
      return;
    }
  
    const rowData = data[row - 1];
  
    if (archive.getLastRow() === 0) {
      archive.appendRow(headers);
    }
  
    rowData[statusIndex] = "Done";
    archive.appendRow(rowData);
    master.deleteRow(row);
    Logger.log("Task at row %s marked as Done and archived.", row);
  
    prioritizeAndScheduleTasks();
  }
  
  
  function runPrioritizationFromUI() {
    prioritizeAndScheduleTasks();
    Logger.log("Prioritization and scheduling run from UI.");
  }
  
  function getFullSchedule() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MasterTasks");
    const data = sheet.getDataRange().getValues();
    const header = data[0];
  
    const taskCol = header.indexOf("Task");
    const categoryCol = header.indexOf("Category");
    const dateCol = header.indexOf("Date to Complete");
    const statusCol = header.indexOf("Status");
  
    if ([taskCol, categoryCol, dateCol, statusCol].includes(-1)) {
      Logger.log("❌ Get Full Schedule: One or more required column headers are missing. Check Task, Category, Date to Complete, Status.");
      return [];
    }
  
    const scheduleMap = {};
  
    for (let i = 1; i < data.length; i++) {
      const status = data[i][statusCol];
      if (status === "Done") continue;
  
      const date = data[i][dateCol];
      const key = (date instanceof Date && !isNaN(date)) ? date.toDateString() : "Unscheduled";
      if (!scheduleMap[key]) scheduleMap[key] = [];
  
      scheduleMap[key].push({
        name: data[i][taskCol],
        category: data[i][categoryCol],
      });
    }
  
    const scheduleArray = Object.entries(scheduleMap)
      .sort(([a], [b]) => {
        if (a === "Unscheduled" && b === "Unscheduled") return 0;
        if (a === "Unscheduled") return 1;
        if (b === "Unscheduled") return -1;
        return new Date(a) - new Date(b);
      })
      .map(([date, tasks]) => ({ date, tasks }));
  
    Logger.log("Generated full schedule.");
    return scheduleArray;
  }
  
  function updateTaskDetails(row, name, category, importance, urgency, dueDate, estimatedTime) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MasterTasks");
    const header = sheet.getDataRange().getValues()[0];
  
    const map = {
      "Task": name,
      "Category": category,
      "Importance": importance,
      "Urgency": urgency,
      "Due Date": dueDate,
      "Estimated Time": estimatedTime
    };
  
    const updates = [];
    for (const [colName, value] of Object.entries(map)) {
      const index = header.indexOf(colName);
      if (index !== -1) {
        let cellValue = value;
        if (colName === "Due Date" && value) {
          cellValue = new Date(value);
        }
        updates.push({row: row, col: index + 1, value: cellValue});
      }
    }
  
    if (updates.length > 0) {
      updates.forEach(update => {
        sheet.getRange(update.row, update.col).setValue(update.value);
      });
      Logger.log("Updated details for task at row %s.", row);
    }
  
    prioritizeAndScheduleTasks();
  }