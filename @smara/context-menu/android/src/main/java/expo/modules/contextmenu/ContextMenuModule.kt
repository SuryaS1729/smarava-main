package expo.modules.contextmenu

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

object ContextMenuEventBridge {
  private var module: Module? = null
  
  fun attach(m: Module) { 
    module = m 
  }
  
  fun detach() { 
    module = null 
  }
  
  fun emitWordSaved(id: String, text: String, createdAt: String) {
    module?.sendEvent("WordSaved", mapOf(
      "id" to id, 
      "text" to text, 
      "created_at" to createdAt
    ))
  }
}

class ContextMenuModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ContextMenu")
    
    Events("WordSaved")
    
    OnCreate {
      ContextMenuEventBridge.attach(this@ContextMenuModule)
    }
    
    OnDestroy {
      ContextMenuEventBridge.detach()
    }
    
    // You can keep the existing functions if needed
    Constants("PI" to Math.PI)
    
    Function("hello") {
      "Hello world! 👋"
    }
    
    AsyncFunction("setValueAsync") { value: String ->
      // Implementation here if needed
    }
  }
}