package app.nalow;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BullePlugin.class); // bulle flottante (copier-coller vers Vinted / Leboncoin)
        registerPlugin(DicteePlugin.class); // dictée vocale native
        registerPlugin(OrientationPlugin.class); // orientation réelle (photos en paysage)
        super.onCreate(savedInstanceState);
    }
}
