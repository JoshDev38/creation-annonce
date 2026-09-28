package app.malow;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BullePlugin.class); // bulle flottante (copier-coller vers Vinted / Leboncoin)
        super.onCreate(savedInstanceState);
    }
}
