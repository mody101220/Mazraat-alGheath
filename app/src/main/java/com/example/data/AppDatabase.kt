package com.example.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

// --------------------------------------------------------------------------
// PERSISTENCE ENTITIES
// --------------------------------------------------------------------------

@Entity(tableName = "market_products")
data class MarketProduct(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val description: String,
    val farmerName: String,
    val pricePerUnit: Double, // price in Syrian Pounds (ل.س) or generic currency
    val unitType: String, // كيلو, صندوق, طن
    val stockLeft: Double,
    val category: String, // خضروات, مواشي, دواجن, ألبان, فواكه
    val rating: Float = 4.8f,
    val imageUrlIndex: Int = 0
)

@Entity(tableName = "market_orders")
data class MarketOrder(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val productName: String,
    val quantity: Double,
    val totalPrice: Double,
    val buyerName: String, // المطعم أو المتجر المشتري
    val status: String, // "قيد الانتظار", "جاري التجهيز", "قيد التوصيل", "تم التسليم"
    val paymentMethod: String, // Sham Cash, MTN Cash, Cash On Delivery
    val deliveryAddress: String,
    val driverName: String? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val xpAwarded: Int = 50,
    val isDriverRewarded: Int = 0 // 0 = False, 1 = True
)

@Entity(tableName = "game_profile")
data class GameProfile(
    @PrimaryKey val id: Int = 1,
    val avatarName: String = "مزارع الغياث المبادر",
    val avatarTitle: String = "مهندس البنية التحتية",
    val allianceName: String = "نخبة الغياث الدولية",
    val goldCoins: Int = 1000,
    val gems: Int = 50,
    val level: Int = 1,
    val xp: Int = 0,
    val lastDailyRewardTime: Long = 0,
    val verifiedMerchantBadge: Int = 1, // 0 = False, 1 = True
    val completionsCount: Int = 0,
    val completedSalesCount: Int = 0
)

@Entity(tableName = "game_crops")
data class GameCrop(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val cropType: String, // "طماطم", "خيار", "ذرة", "بطاطا", "بطيخ"
    val plantedAt: Long = System.currentTimeMillis(),
    val durationSeconds: Int = 30,
    val isWatered: Int = 0, // 0 = No, 1 = Yes
    val isHarvested: Int = 0
)

@Entity(tableName = "game_livestock")
data class GameLivestock(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val animalType: String, // "أغنام", "ماعز", "دواجن"
    val count: Int = 1,
    val health: Int = 100, // 0 to 100
    val lastFedTime: Long = System.currentTimeMillis()
)

// --------------------------------------------------------------------------
// DATA ACCESS OBJECTS (DAOs)
// --------------------------------------------------------------------------

@Dao
interface MarketProductDao {
    @Query("SELECT * FROM market_products ORDER BY id DESC")
    fun getAllProducts(): Flow<List<MarketProduct>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: MarketProduct)

    @Update
    suspend fun updateProduct(product: MarketProduct)

    @Query("DELETE FROM market_products WHERE id = :id")
    suspend fun deleteProductById(id: Int)

    @Query("SELECT COUNT(*) FROM market_products")
    suspend fun getCount(): Int
}

@Dao
interface MarketOrderDao {
    @Query("SELECT * FROM market_orders ORDER BY timestamp DESC")
    fun getAllOrders(): Flow<List<MarketOrder>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: MarketOrder): Long

    @Update
    suspend fun updateOrder(order: MarketOrder)

    @Query("SELECT * FROM market_orders WHERE id = :id LIMIT 1")
    suspend fun getOrderById(id: Int): MarketOrder?
}

@Dao
interface GameProfileDao {
    @Query("SELECT * FROM game_profile WHERE id = 1 LIMIT 1")
    fun getProfileFlow(): Flow<GameProfile?>

    @Query("SELECT * FROM game_profile WHERE id = 1 LIMIT 1")
    suspend fun getProfileDirect(): GameProfile?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateProfile(profile: GameProfile)
}

@Dao
interface GameCropDao {
    @Query("SELECT * FROM game_crops WHERE isHarvested = 0 ORDER BY plantedAt DESC")
    fun getActiveCropsFlow(): Flow<List<GameCrop>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCrop(crop: GameCrop)

    @Update
    suspend fun updateCrop(crop: GameCrop)

    @Query("DELETE FROM game_crops WHERE id = :id")
    suspend fun deleteCropById(id: Int)
}

@Dao
interface GameLivestockDao {
    @Query("SELECT * FROM game_livestock ORDER BY id DESC")
    fun getAllLivestockFlow(): Flow<List<GameLivestock>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLivestock(livestock: GameLivestock)

    @Update
    suspend fun updateLivestock(livestock: GameLivestock)

    @Query("DELETE FROM game_livestock WHERE id = :id")
    suspend fun deleteLivestockById(id: Int)
}

// --------------------------------------------------------------------------
// DATABASE HOLDER
// --------------------------------------------------------------------------

@Database(
    entities = [
        MarketProduct::class,
        MarketOrder::class,
        GameProfile::class,
        GameCrop::class,
        GameLivestock::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): MarketProductDao
    abstract fun orderDao(): MarketOrderDao
    abstract fun profileDao(): GameProfileDao
    abstract fun cropDao(): GameCropDao
    abstract fun livestockDao(): GameLivestockDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "ghaith_farm_database"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

// --------------------------------------------------------------------------
// REPOSITORY PATTERN FOR MVVM ACCESS
// --------------------------------------------------------------------------

class AppRepository(private val db: AppDatabase) {
    val allProducts: Flow<List<MarketProduct>> = db.productDao().getAllProducts()
    val allOrders: Flow<List<MarketOrder>> = db.orderDao().getAllOrders()
    val gameProfile: Flow<GameProfile?> = db.profileDao().getProfileFlow()
    val activeCrops: Flow<List<GameCrop>> = db.cropDao().getActiveCropsFlow()
    val allLivestock: Flow<List<GameLivestock>> = db.livestockDao().getAllLivestockFlow()

    suspend fun insertProduct(product: MarketProduct) = db.productDao().insertProduct(product)
    suspend fun updateProduct(product: MarketProduct) = db.productDao().updateProduct(product)
    suspend fun deleteProduct(id: Int) = db.productDao().deleteProductById(id)

    suspend fun insertOrder(order: MarketOrder): Long = db.orderDao().insertOrder(order)
    suspend fun updateOrder(order: MarketOrder) = db.orderDao().updateOrder(order)
    suspend fun getOrderById(id: Int): MarketOrder? = db.orderDao().getOrderById(id)

    suspend fun getProfileDirect(): GameProfile {
        var profile = db.profileDao().getProfileDirect()
        if (profile == null) {
            profile = GameProfile()
            db.profileDao().insertOrUpdateProfile(profile)
        }
        return profile
    }

    suspend fun updateProfile(profile: GameProfile) = db.profileDao().insertOrUpdateProfile(profile)

    suspend fun insertCrop(crop: GameCrop) = db.cropDao().insertCrop(crop)
    suspend fun updateCrop(crop: GameCrop) = db.cropDao().updateCrop(crop)
    suspend fun deleteCrop(id: Int) = db.cropDao().deleteCropById(id)

    suspend fun insertLivestock(livestock: GameLivestock) = db.livestockDao().insertLivestock(livestock)
    suspend fun updateLivestock(livestock: GameLivestock) = db.livestockDao().updateLivestock(livestock)
    suspend fun deleteLivestock(id: Int) = db.livestockDao().deleteLivestockById(id)

    suspend fun populateInitialDataIfEmpty() {
        if (db.productDao().getCount() == 0) {
            val initialProducts = listOf(
                MarketProduct(
                    name = "طماطم درعاوية حورانية قطاف أول",
                    description = "طماطم طازجة ناضجة تحت أشعة الشمس ممتازة للمطاعم والسلطات.",
                    farmerName = "مزرعة جبل العرب النموذجية",
                    pricePerUnit = 4500.0,
                    unitType = "كيلو",
                    stockLeft = 250.0,
                    category = "خضروات",
                    imageUrlIndex = 1
                ),
                MarketProduct(
                    name = "خيار بلدي مروي بمياه الينابيع",
                    description = "خيار بلدي طازج ومقرمش، طبيعي وعضوي بالكامل دون أسمدة كيميائية.",
                    farmerName = "مزارع غوطة دمشق الخضراء",
                    pricePerUnit = 3800.0,
                    unitType = "كيلو",
                    stockLeft = 180.0,
                    category = "خضروات",
                    imageUrlIndex = 2
                ),
                MarketProduct(
                    name = "ذرة حلوة صفراء طازجة الكيلو",
                    description = "أكواز ذرة شهية وحلوة المذاق مناسبة للشواء والتسالي والطهي السريع.",
                    farmerName = "سهل الغاب الخصيب",
                    pricePerUnit = 5500.0,
                    unitType = "كيلو",
                    stockLeft = 120.0,
                    category = "خضروات",
                    imageUrlIndex = 3
                ),
                MarketProduct(
                    name = "بطاطا تشرينية فاخرة للطهي والقلي",
                    description = "حجم متناسق ومذاق غني، مخصصة للمطاعم والبيع بالجملة لطهي أشهى الأطباق.",
                    farmerName = "الجمعية الزراعية في حمص",
                    pricePerUnit = 4200.0,
                    unitType = "صندوق",
                    stockLeft = 500.0,
                    category = "خضروات",
                    imageUrlIndex = 4
                ),
                MarketProduct(
                    name = "بطيخ بلدي أحمر ريان حلوة وناضجة",
                    description = "بطيخ أحمر كبير ومنعش طعم رائع مروي بأحدث الطرق التكنولوجية.",
                    farmerName = "مزرعة الفرات الحديثة",
                    pricePerUnit = 12000.0,
                    unitType = "صندوق",
                    stockLeft = 95.0,
                    category = "فواكه",
                    imageUrlIndex = 5
                )
            )
            for (p in initialProducts) {
                db.productDao().insertProduct(p)
            }

            // Seed livestock
            db.livestockDao().insertLivestock(GameLivestock(animalType = "أغنام", count = 3, health = 100))
            db.livestockDao().insertLivestock(GameLivestock(animalType = "ماعز", count = 2, health = 95))
            db.livestockDao().insertLivestock(GameLivestock(animalType = "دواجن", count = 10, health = 100))
        }
    }
}
