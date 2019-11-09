#include "colors.inc"  
#include "finish.inc"  

global_settings { assumed_gamma 2.2 }
global_settings { ambient_light rgb<1,1,1> }                   
                   
#declare ShinyFinish =
finish {              
   ambient .4
   diffuse 0.7
//   reflection {0.1, 0.3 fresnel}
   specular 0.3 roughness 0.0035 
}                   
                   
#declare COLOR_STEP  = floor(div(clock,3)) / 3;                   
#declare BODY_COLOR  = color rgb<1-COLOR_STEP,0.5,COLOR_STEP>;
                                 
                                 
                                 


#macro EYE(Side,SkinColor,Angriness)  
    union
    {                 
        // Valkuainen
        sphere
        {
            <0, 0, 0>, 1
            
            texture {
                pigment {color rgb<1,1,1>}
                finish {ShinyFinish}
            }                        
        }            

        // Mustuainen
        sphere
        {
            <0, 0, 0>, 0.81
            
            texture {
                pigment {color rgb<0,0,0>}
                finish {ShinyFinish}
            }    
            translate <0, 0, -0.2>   
        }
        
        // Silmäluomi
        intersection
        {
            sphere{
                <0, 0, 0>, 1
            }
            box{<-1,0,-1>,<1,1,1>}
            rotate Side * z * Angriness
            texture {
                pigment {color SkinColor}
                finish {ShinyFinish}
            }                        
            scale 1.03
            
        }                   
        
        
        scale 0.3
        translate <Side * 0.22, 0.2, -0.75>                         
    }
#end     


#macro TOOTH(toothPlace)  
    union
    {                 
        // Valkuainen
        sphere
        {
            <0, 0, 0>, 1
            
            texture {
                pigment {color rgb<1,1,1>}
                finish {ShinyFinish}
            }  
            
            scale <0.045,0.1,0.02>
            translate <0,0,-0.95>                      
            rotate x * -12
            rotate y * toothPlace
        }            
                
    }
#end



#macro MONSTER(BodySize,BodyColor,Angriness)

    union
    { 
        
        difference
        {             
            // head
            sphere
            {
                <0, 0, 0>, 1   
                
               texture {
                  pigment {color BodyColor}
                  finish {ShinyFinish}
               }                        
            }   
            
            
            // Suu
            sphere
            {
                <0, 0, 0>, 0.65
                
               texture {
                  pigment {color rgb<1,0,0>}
                  finish {ShinyFinish}
               }
               scale y * 0.2                        
               rotate x * Angriness
               translate <0,-0.4,-0.5>               
            }   
        }
        
        EYE(1, BodyColor,Angriness)
        EYE(-1, BodyColor,Angriness)
        TOOTH(-33)
        TOOTH(-27)
        TOOTH(-21)
        TOOTH(-15)
        TOOTH(-9)
        TOOTH(-3)
        TOOTH(3)
        TOOTH(9)
        TOOTH(15)
        TOOTH(21)
        TOOTH(27)
        TOOTH(33)
        
        
        scale BodySize                            
    }    
#end


camera {
   location  <0, 0, -10>
   direction <0, 0, 1>
   look_at   <0, 0, 0>                  
   right x*image_width/image_height
}
                   
                   

light_source { <40, 30, -45> color red 1 green 1 blue 1 }



                   
               
MONSTER(4, BODY_COLOR, mod(clock,3)*20 - 20)              



#warning  concat("clock is:",str(clock,5,0),"\n")
#warning  concat("Value is:",str(mod(clock,4),5,0),"\n")