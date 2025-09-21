package expo.modules.contextmenu

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.database.sqlite.SQLiteDatabase
import android.os.Bundle
import android.util.Log
import android.widget.Toast
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

class ProcessTextActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val selected = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString()?.trim()
    if (selected.isNullOrBlank()) { 
      finish() 
      return 
    }

    // Use the EXACT path that Expo SQLite uses: files/SQLite/
    val dbFile = File(this.applicationContext.filesDir, "SQLite/smara.db")
    
    // Ensure the SQLite directory exists
    dbFile.parentFile?.mkdirs()
    
    val dbPath = dbFile.absolutePath
    Log.d("ProcessTextActivity", "Using database path: $dbPath")
    
    var db: SQLiteDatabase? = null

    try {
      db = SQLiteDatabase.openOrCreateDatabase(dbPath, null)
      
      // Create table
      db.execSQL("""
        CREATE TABLE IF NOT EXISTS words(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          text TEXT NOT NULL,
          source_url TEXT,
          source_app TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT
        )
      """)

      // Check current word count before insert
      val beforeCursor = db.rawQuery("SELECT COUNT(*) FROM words", null)
      beforeCursor.moveToFirst()
      val countBefore = beforeCursor.getInt(0)
      beforeCursor.close()
      
      Log.d("ProcessTextActivity", "Words count before insert: $countBefore")

      // Use ISO 8601 format like JavaScript Date.toISOString()
      val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
      dateFormat.timeZone = TimeZone.getTimeZone("UTC")
      val now = dateFormat.format(Date())

      // Use ContentValues for safe insertion
      val values = ContentValues().apply {
        put("text", selected)
        put("source_app", "android-process-text")
        put("created_at", now)
        put("updated_at", now)
      }

      val rowId = db.insert("words", null, values)
      Log.d("ProcessTextActivity", "Insert result rowId: $rowId")
      
      if (rowId != -1L) {
        // Check count after insert
        val afterCursor = db.rawQuery("SELECT COUNT(*) FROM words", null)
        afterCursor.moveToFirst()
        val countAfter = afterCursor.getInt(0)
        afterCursor.close()
        
        Log.d("ProcessTextActivity", "Words count after insert: $countAfter")
        
        // fire JS event if app is alive (no-op if not)
        ContextMenuEventBridge.emitWordSaved(rowId.toString(), selected, now)
        Toast.makeText(this, "Saved to Smara ✓ (ID: $rowId, Total: $countAfter)", Toast.LENGTH_LONG).show()
      } else {
        Toast.makeText(this, "Failed to save word", Toast.LENGTH_LONG).show()
      }
      
    } catch (e: Exception) {
      Log.e("ProcessTextActivity", "Database error", e)
      Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_LONG).show()
      e.printStackTrace()
    } finally {
      db?.close()
      finish()
    }
  }
}